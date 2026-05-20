"use client";

import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  ArrowsDownUp,
  Bank,
  Bell,
  Clock,
  GraduationCap,
  Percent,
  SealCheck,
} from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import AppShell from "./components/app-shell";
import { TokenArtwork } from "./components/token-artwork";
import { type Token, tokenFromOnChain } from "./lib/token-data";
import { useTokens } from "@/hooks/use-tokens";
import { useTokenMetadata } from "@/hooks/use-token-metadata";
import { useSolPrice } from "@/hooks/use-sol-price";
import { useHyperliquidUniverse } from "@/hooks/use-hyperliquid-universe";
import type { TokenListItem } from "@/lib/api";

function formatUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toExponential(2)}`;
}

function formatLiquidityUsd(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n <= 0) return "$0.00";
  return formatUsd(n);
}

function PerpChip({
  symbol,
  leverageBps,
  direction,
}: {
  symbol: string;
  leverageBps: number;
  direction: "long" | "short";
}) {
  const x = (leverageBps / 10_000).toFixed(0);
  const isLong = direction === "long";
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center gap-1 rounded-md px-1.5 py-0 text-[10px] font-bold leading-none tracking-tight ${isLong ? "bg-[#065f46]/12 text-[#065f46]" : "bg-[#b42318]/12 text-[#b42318]"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://app.hyperliquid.xyz/coins/${symbol}.svg`}
        alt=""
        width={10}
        height={10}
        className="size-2.5 rounded-full"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
      <span>{symbol}</span>
      <span>·</span>
      <span>{x}×</span>
      <span>{isLong ? "LONG" : "SHORT"}</span>
    </span>
  );
}

type TabId = "new" | "activity" | "completion" | "graduated" | "volume" | "oldest";

const tabs: Array<{ id: TabId; label: string; icon: typeof Clock }> = [
  { id: "new",        label: "New Tokens",     icon: Clock },
  { id: "activity",   label: "Recent Activity", icon: Bell },
  { id: "completion", label: "Completion",     icon: Percent },
  { id: "graduated",  label: "Graduated",      icon: GraduationCap },
  { id: "volume",     label: "Volume",         icon: ArrowsDownUp },
  { id: "oldest",     label: "Oldest",         icon: Bank },
];

function progressFromItem(item: TokenListItem): number {
  if (!item.total_minted) return 0;
  const minted = Number(item.total_minted);
  const mintable = 800_000_000 * 1e9; // matches program constant
  return Math.min(100, (minted / mintable) * 100);
}

function applySort(items: TokenListItem[], tab: TabId): TokenListItem[] {
  const ts = (s: string | null | undefined) =>
    s ? new Date(s).getTime() : 0;
  const arr = [...items];
  switch (tab) {
    case "new":
    case "activity":
      // Without an indexer, "Recent Activity" approximates to recency of mint.
      arr.sort((a, b) => ts(b.first_seen_at ?? b.created_at) - ts(a.first_seen_at ?? a.created_at));
      return arr;
    case "oldest":
      arr.sort((a, b) => ts(a.first_seen_at ?? a.created_at) - ts(b.first_seen_at ?? b.created_at));
      return arr;
    case "completion":
      arr.sort((a, b) => progressFromItem(b) - progressFromItem(a));
      return arr;
    case "graduated":
      return arr.filter((x) => x.graduated);
    case "volume":
      arr.sort((a, b) => Number(b.volume_24h ?? 0) - Number(a.volume_24h ?? 0));
      return arr;
  }
}

function MetricRow({
  label,
  value,
  positive = true,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-[#6f857c]">
        {label}
      </div>
      <div
        className={`text-[13px] font-medium ${label === "24h" ? (positive ? "text-[#065f46]" : "text-[#b42318]") : "text-[#17372d]"}`}
      >
        {value}
      </div>
    </div>
  );
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

function TokenCard({
  token,
  large = false,
  solPriceUsd = 0,
  perpSymbol,
}: {
  token: Token;
  large?: boolean;
  solPriceUsd?: number;
  perpSymbol?: string;
}) {
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [localName, setLocalName] = useState<string | null>(null);
  const [localSymbol, setLocalSymbol] = useState<string | null>(null);

  useEffect(() => {
    try {
      const rawImages = window.localStorage.getItem("lyl_token_images") ?? "{}";
      const imageMap = JSON.parse(rawImages) as Record<string, string>;
      setLocalImage(normalizeOptionalText(imageMap[token.slug]));

      const rawStubs = window.localStorage.getItem("lyl_token_stubs") ?? "{}";
      const stubMap = JSON.parse(rawStubs) as Record<
        string,
        { name?: string | null; symbol?: string | null }
      >;
      setLocalName(normalizeOptionalText(stubMap[token.slug]?.name));
      setLocalSymbol(normalizeOptionalText(stubMap[token.slug]?.symbol));
    } catch {
      setLocalImage(null);
      setLocalName(null);
      setLocalSymbol(null);
    }
  }, [token.slug]);

  const { data: tokenMetadata } = useTokenMetadata(token.slug);
  const imageUrl =
    normalizeOptionalText(token.image) ??
    normalizeOptionalText(localImage) ??
    normalizeOptionalText(tokenMetadata?.image) ??
    null;
  const displayName =
    token.name === "Untitled"
      ? localName ?? tokenMetadata?.name ?? token.name
      : token.name;
  const displaySymbol =
    token.symbol === "—"
      ? localSymbol ?? tokenMetadata?.symbol ?? token.symbol
      : token.symbol;
  const positive = !token.change.startsWith("-");

  const mcUsd =
    token.mcSol !== undefined && solPriceUsd > 0
      ? token.mcSol * solPriceUsd
      : 0;
  const liquiditySol = token.liquiditySol;
  const hasLiquidity = liquiditySol !== undefined && solPriceUsd > 0;
  const liqUsd = hasLiquidity ? liquiditySol * solPriceUsd : 0;
  const mcDisplay = mcUsd > 0 ? formatUsd(mcUsd) : "—";
  const liqDisplay = hasLiquidity ? formatLiquidityUsd(liqUsd) : "—";
  const hasPosition =
    token.leverageBps !== undefined && token.positionDirection !== undefined;

  if (!large) {
    return (
      <article className="group flex">
        <Link href={`/token/${token.slug}`} className="block w-full">
          <div className="flex w-full flex-col">
            <div className="relative h-40 w-full overflow-hidden rounded-lg md:h-56 md:rounded-xl">
              <TokenArtwork type={token.art} imageUrl={imageUrl} />
            </div>
            <div className="flex flex-col space-y-2.5 px-2 py-2">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1 overflow-hidden">
                   <h3 className="flex min-w-0 items-center gap-2 text-base font-semibold text-[#17372d]">
                     <span className="truncate">{displayName}</span>
                   </h3>
                   <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium tracking-wide text-[#6f857c]">
                     <span className="inline-flex items-center gap-1 uppercase hover:text-[#065f46] hover:underline">
                       {displaySymbol}
                       <ArrowSquareOut size={10} className="text-[#8aa296]" />
                     </span>
                    <span className="text-[#065f46]/30">.</span>
                    <span className="tabular-nums shrink-0">{token.age}</span>
                  </div>
                </div>
              </div>
              {hasPosition ? (
                <div>
                  <PerpChip
                    symbol={perpSymbol ?? "?"}
                    leverageBps={token.leverageBps ?? 10_000}
                    direction={token.positionDirection ?? "long"}
                  />
                </div>
              ) : null}
              <div className="flex flex-row justify-between gap-3 text-xs">
                <MetricRow label="Liquidity" value={liqDisplay} />
                <MetricRow label="MC" value={mcDisplay} />
                <MetricRow
                  label="24h"
                  value={token.change}
                  positive={positive}
                />
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="group flex shrink-0 rounded-2xl border border-[#065f46]/15 bg-[#fffaf3] p-1.5 shadow-sm">
      <Link
        href={`/token/${token.slug}`}
        className="block w-[280px] md:min-w-[320px]"
      >
        <div className="relative h-[160px] overflow-hidden rounded-lg md:h-[180px] md:rounded-xl">
          <TokenArtwork type={token.art} imageUrl={imageUrl} />
        </div>
        <div className="space-y-2 px-1 pt-1.5">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1 overflow-hidden">
              <h3 className="flex min-w-0 items-center gap-2 text-base font-semibold text-[#17372d]">
                <span className="truncate">{displayName}</span>
                <SealCheck
                  size={14}
                  weight="fill"
                  className="shrink-0 text-[#065f46]"
                />
              </h3>
              <div className="mt-0.5 flex items-center gap-1 text-[11px] font-medium tracking-wide text-[#6f857c]">
                <span className="inline-flex items-center gap-1 uppercase hover:text-[#065f46] hover:underline">
                  {displaySymbol}
                  <ArrowSquareOut size={10} className="text-[#8aa296]" />
                </span>
                <span className="text-[#065f46]/30">.</span>
                <span className="tabular-nums shrink-0">{token.age}</span>
              </div>
            </div>
          </div>
          {hasPosition ? (
            <div>
              <PerpChip
                symbol={perpSymbol ?? "?"}
                leverageBps={token.leverageBps ?? 10_000}
                direction={token.positionDirection ?? "long"}
              />
            </div>
          ) : null}
          <div className="flex flex-row justify-between gap-3 text-[11px]">
            <MetricRow label="Liquidity" value={liqDisplay} />
            <MetricRow label="MC" value={mcDisplay} />
            <MetricRow label="24h" value={token.change} positive={positive} />
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function HomePage() {
  const trendingScrollRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("new");
  const { solPriceUsd } = useSolPrice();
  const { markets } = useHyperliquidUniverse();
  const perpSymbolByIndex = useMemo(() => {
    const m = new Map<number, string>();
    (markets ?? []).forEach((mkt) => m.set(mkt.index, mkt.baseSymbol));
    return m;
  }, [markets]);

  // Real on-chain launches only. No mock fallback.
  const { data: onChain, isLoading } = useTokens();

  // Trending stays in default (newest first) order regardless of tab.
  const trendingSource = useMemo(
    () => applySort(onChain ?? [], "new"),
    [onChain],
  );
  const trendingTokens: Token[] = useMemo(
    () => trendingSource.slice(0, 6).map(tokenFromOnChain),
    [trendingSource],
  );

  const gridSource = useMemo(
    () => applySort(onChain ?? [], activeTab),
    [onChain, activeTab],
  );
  const tokenGrid: Token[] = useMemo(
    () => gridSource.map(tokenFromOnChain),
    [gridSource],
  );

  const hasLaunches = trendingTokens.length > 0;
  const hasGridResults = tokenGrid.length > 0;

  const scrollTrending = (direction: "left" | "right") => {
    const container = trendingScrollRef.current;

    if (!container) {
      return;
    }

    container.scrollBy({
      left: direction === "left" ? -336 : 336,
      behavior: "smooth",
    });
  };

  return (
    <AppShell>
      <div className="px-4 pb-8 md:px-8">
        <section className="group/section">
          <div className="flex items-center justify-between px-2 py-3 md:px-4 md:py-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <h2 className="flex items-center gap-3 text-base font-bold text-[#17372d] md:text-xl">
                Trending Tokens
              </h2>
              <p className="w-full max-w-sm text-xs font-medium text-[#6f857c] md:text-sm">
                The most popular perp-backed launches on LYL.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Scroll left"
                onClick={() => scrollTrending("left")}
                className="inline-flex size-6 items-center justify-center rounded-sm bg-[#e6ddd0] text-[#065f46] transition-colors hover:bg-[#065f46] hover:text-[#f5f2ed] md:size-8"
              >
                <ArrowLeft size={13} />
              </button>
              <button
                type="button"
                aria-label="Scroll right"
                onClick={() => scrollTrending("right")}
                className="inline-flex size-6 items-center justify-center rounded-sm bg-[#e6ddd0] text-[#065f46] transition-colors hover:bg-[#065f46] hover:text-[#f5f2ed] md:size-8"
              >
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          <div
            ref={trendingScrollRef}
            className="trending-scroll overflow-x-auto overscroll-x-contain scroll-smooth pl-2 pb-3 md:pl-4"
          >
            {hasLaunches ? (
              <div className="flex min-w-max gap-4">
                {trendingTokens.map((token) => (
                  <TokenCard
                    key={token.slug}
                    token={token}
                    large
                    solPriceUsd={solPriceUsd}
                    perpSymbol={
                      token.perpAsset !== undefined
                        ? perpSymbolByIndex.get(token.perpAsset)
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-sm text-[#6f857c]">
                {isLoading ? "loading launches..." : "no launches yet. be the first."}
              </div>
            )}
          </div>
        </section>

        <section className="mt-4 border-b border-[#065f46]/15 pb-12 md:mt-6">
          <div className="border-b border-[#065f46]/15">
            <div className="hide-scrollbar -mb-1 flex h-10 w-full flex-nowrap items-center justify-start gap-2 overflow-x-auto border-b border-[#065f46]/15 pl-4 pr-6 md:-mb-px md:h-12 md:gap-3 md:pl-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-pressed={isActive}
                    className={`relative z-[1] inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-xs font-bold tracking-wide transition-colors duration-150 md:py-3 md:text-sm ${isActive ? "border-[#065f46] text-[#065f46]" : "border-transparent text-[#6f857c] hover:text-[#065f46]"}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon size={14} />
                      <span>{tab.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 px-4 pt-6 min-[460px]:grid-cols-2 lg:grid-cols-3 md:px-6 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6">
            {hasGridResults ? tokenGrid.map((token) => (
              <TokenCard
                key={token.slug}
                token={token}
                solPriceUsd={solPriceUsd}
                perpSymbol={
                  token.perpAsset !== undefined
                    ? perpSymbolByIndex.get(token.perpAsset)
                    : undefined
                }
              />
            )) : (
              <div className="col-span-full px-4 py-12 text-center text-sm text-[#6f857c]">
                {isLoading ? (
                  "loading launches from chain..."
                ) : !hasLaunches ? (
                  <span>
                    no launches yet. <a href="/create" className="text-[#065f46] underline">launch the first one</a>.
                  </span>
                ) : activeTab === "graduated" ? (
                  "no graduated tokens. perp-backed launches never auto-graduate."
                ) : activeTab === "volume" ? (
                  "no 24h volume data yet."
                ) : (
                  "no tokens in this view."
                )}
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-center gap-1 px-4 md:px-6">
            <button
              type="button"
              disabled
              className="inline-flex size-8 items-center justify-center rounded-sm border border-[#065f46]/15 bg-[#fffaf3] text-[#6f857c] shadow-sm disabled:opacity-50 md:size-9"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-sm bg-[#065f46] text-xs font-medium text-[#f5f2ed] md:size-9"
            >
              1
            </button>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-sm border border-[#065f46]/15 bg-[#fffaf3] text-xs font-medium text-[#17372d] shadow-sm hover:bg-[#e6ddd0] md:size-9"
            >
              2
            </button>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-sm border border-[#065f46]/15 bg-[#fffaf3] text-[#17372d] shadow-sm hover:bg-[#e6ddd0] md:size-9"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
