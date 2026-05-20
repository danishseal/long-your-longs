"use client";

import {
  ArrowSquareOut,
  Briefcase,
  Copy,
  SealWarning,
  Shield,
  User,
} from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import AppShell from "../../components/app-shell";
import FaqAccordion from "../../components/faq-accordion";
import { TokenArtwork } from "../../components/token-artwork";
import TokenChart from "../../components/token-chart";
import PumpPortalChart from "../../components/pumpportal-chart";
import { usePumpStats } from "@/hooks/use-pump-stats";
import { useTokenDetail } from "@/hooks/use-token-detail";
import { tokenFromOnChain, getTokenBySlug } from "../../lib/token-data";
import { TradePanel } from "@/components/trading/trade-panel";
import { useHyperliquidUniverse } from "@/hooks/use-hyperliquid-universe";
import { useLaunchActivity } from "@/hooks/use-launch-activity";
import { PerpPositionPanel } from "@/components/trading/perp-position-panel";
import { PendingTxPanel } from "@/components/trading/pending-tx-panel";
import { RefillLogPanel } from "@/components/trading/refill-log-panel";
import { useSolPrice } from "@/hooks/use-sol-price";
import { useRefills } from "@/hooks/use-refills";

function fmtUsd(n: number, opts: { compact?: boolean } = {}): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (opts.compact) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  }
  if (n >= 1) return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n >= 0.000001) return `$${n.toFixed(8)}`;
  return `$${n.toExponential(3)}`;
}

interface Props {
  slug: string;
}

export default function TokenDetailClient({ slug }: Props) {
  // All hooks must be called unconditionally before any early returns.
  const { data: item, isLoading } = useTokenDetail(slug);
  const { markets } = useHyperliquidUniverse();
  const isLive = !!item;
  const { data: liveActivity } = useLaunchActivity(isLive ? slug : "", {
    source: item?.source === "pump" ? "pump" : "perp",
  });
  const { solPriceUsd } = useSolPrice();
  const isPump = item?.source === "pump";
  const { data: pumpStats } = usePumpStats(slug, { enabled: isLive && isPump });
  const { data: refills } = useRefills(slug, { enabled: isLive });

  // Live launch if found by address; else fall back to the mock slug lookup so
  // demo links (render-token, pudgy-penguins…) keep working.
  const token = item ? tokenFromOnChain(item) : getTokenBySlug(slug);

  if (!token) {
    // Show loading state while the RPC catches up or the first fetch is in
    // flight. Only declare "not found" after we've definitively tried.
    if (isLoading || item === undefined) {
      return (
        <AppShell showTicker={false}>
          <div className="p-8 text-[#647067]">loading launch…</div>
        </AppShell>
      );
    }
    return (
      <AppShell showTicker={false}>
        <div className="p-8 text-[#647067]">token not found</div>
      </AppShell>
    );
  }

  const coin = isLive && item?.perp_asset !== undefined
    ? (markets?.find((m) => m.index === item.perp_asset)?.baseSymbol ?? "BTC")
    : "BTC";

  // All numbers below come from on-chain reads only:
  //   - Mode B: usePumpStats reads pump.fun's BondingCurve account directly
  //     + parses recent buy/sell txs to compute 1H/6H/24H % from real prices.
  //   - Mode A: priceSol/mcSol/liquiditySol from our own curve account, also
  //     computed entirely from on-chain reserves (no indexer).
  const onchainPriceSol = isPump && pumpStats ? pumpStats.priceSol : token.priceSol ?? 0;
  const onchainLiqSol =
    isPump && pumpStats ? pumpStats.realSolReserves : token.liquiditySol ?? 0;
  const onchainMcSol = onchainPriceSol * 1_000_000_000; // 1B supply both modes

  const priceUsd = onchainPriceSol > 0 && solPriceUsd > 0 ? onchainPriceSol * solPriceUsd : 0;
  const mcUsd = onchainMcSol > 0 && solPriceUsd > 0 ? onchainMcSol * solPriceUsd : 0;
  const liqUsd = onchainLiqSol > 0 && solPriceUsd > 0 ? onchainLiqSol * solPriceUsd : 0;

  const priceDisplay = priceUsd > 0 ? fmtUsd(priceUsd) : "—";
  const mcDisplay = mcUsd > 0 ? fmtUsd(mcUsd, { compact: true }) : "—";
  const liqDisplay = liqUsd > 0 ? fmtUsd(liqUsd, { compact: true }) : "—";

  // 1H / 6H / 24H % change — Mode B from on-chain trade history, Mode A from
  // its own activity log when available, else 0.
  const fmtPct = (n: number): string => {
    if (!Number.isFinite(n)) return "0.00%";
    const sign = n >= 0 ? "+" : "";
    return `${sign}${n.toFixed(2)}%`;
  };
  const change1hStr = fmtPct(pumpStats?.change1h ?? 0);
  const change6hStr = fmtPct(pumpStats?.change6h ?? 0);
  const change24hStr = fmtPct(pumpStats?.change24h ?? 0);
  const isUp = (s: string) => !s.startsWith("-") && !s.startsWith("0.00");
  const pctColor = (s: string) =>
    s.startsWith("0.00") ? "text-[#7a827b]" : isUp(s) ? "text-[#065f46]" : "text-[#b42318]";

  const leverageBps = isLive ? item?.leverage_bps : undefined;
  const launchDirection: "long" | "short" =
    (isLive ? item?.direction : "long") ?? "long";
  const launchTs = isLive && item?.created_at
    ? Math.floor(new Date(item.created_at).getTime() / 1000)
    : undefined;

  // For Mode A: have any buys or sells actually happened on this launch yet?
  //   - real_sol_reserves > 0 means SOL has flowed through the curve
  //   - liveActivity contains at least one buy/sell tx
  // Used to gate the chart + perp panel from showing synthetic data before
  // the first real trade.
  const realSolReserves = isLive ? Number(item?.real_sol_reserves ?? 0) : 0;
  const tradeActivityCount = (liveActivity ?? []).filter(
    (a) => a.kind === "buy" || a.kind === "sell",
  ).length;
  const hasTradedYet = realSolReserves > 0 || tradeActivityCount > 0;

  const mintAddress = isLive ? item?.address : null;
  const creatorAddress = isLive ? item?.creator : null;

  async function copyToClipboard(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`, { duration: 1500 });
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <AppShell showTicker={false}>
      <div className="container mx-auto grid h-full w-full flex-1 grid-cols-1 divide-x divide-white/8 lg:grid-cols-12">
        <section className="min-vh-screen lg:col-span-7">
          <div className="border-b border-[#065f46]/10 p-4 px-2 md:px-6 md:py-4">
            <div className="relative flex flex-wrap justify-between gap-3 md:gap-4">
              <div className="flex flex-row gap-3">
                <div className="size-10 overflow-hidden rounded-sm lg:size-14">
                  <TokenArtwork type={token.art} imageUrl={token.image} />
                </div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <h1 className="flex w-full max-w-[280px] items-center gap-2 text-xl font-bold leading-tight md:max-w-[420px] md:tracking-tight lg:text-2xl">
                    <span className="min-w-0 truncate">{token.name}</span>
                    {token.warnings ? (
                      <SealWarning size={16} className="text-[#f0b90b]" />
                    ) : null}
                    {token.badge ? (
                      <span className="ml-1 inline-flex items-center gap-1 rounded-md border border-[#065f46]/15 px-2.5 py-0.5 pl-1.5 text-[10px] font-semibold leading-[150%] tracking-tight text-[#17372d] md:text-xs">
                        <Briefcase size={12} />
                        <span>{token.badge}</span>
                      </span>
                    ) : null}
                  </h1>
                  <div className="flex flex-wrap items-center gap-1 text-[10px] font-medium text-[#547468] md:gap-1.5 md:text-xs">
                    <span>{token.symbol}</span>
                    <span className="text-[#547468]/40">.</span>
                    <span className="inline-flex items-center gap-1">
                      {mintAddress ? (
                        <a
                          href={`https://solscan.io/token/${mintAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:text-[#065f46] hover:underline"
                          title="Open on Solscan"
                        >
                          {token.contract}
                          <ArrowSquareOut size={10} />
                        </a>
                      ) : (
                        <span>{token.contract}</span>
                      )}
                      {mintAddress ? (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(mintAddress, "Mint")}
                          aria-label="Copy mint address"
                          className="ml-1 inline-flex items-center text-[#8aa296] hover:text-[#065f46]"
                        >
                          <Copy size={10} />
                        </button>
                      ) : null}
                    </span>
                    <span className="text-[#547468]/40">.</span>
                    <span className="inline-flex min-w-0 max-w-[160px] items-center gap-1 truncate">
                      <Briefcase size={12} />
                      {creatorAddress ? (
                        <a
                          href={`https://solscan.io/account/${creatorAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:text-[#065f46] hover:underline"
                          title="Open creator on Solscan"
                        >
                          {token.creator}
                        </a>
                      ) : (
                        <span className="truncate">{token.creator}</span>
                      )}
                      {creatorAddress ? (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(creatorAddress, "Creator")}
                          aria-label="Copy creator address"
                          className="inline-flex items-center text-[#8aa296] hover:text-[#065f46]"
                        >
                          <Copy size={10} />
                        </button>
                      ) : null}
                    </span>
                    <span className="text-[#547468]/40">.</span>
                    <span className="tabular-nums shrink-0">{token.age}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 border-b border-[#065f46]/10 bg-[repeating-linear-gradient(-45deg,transparent_0,transparent_6px,rgba(6,95,70,0.04)_6px,rgba(6,95,70,0.04)_7px)]">
            <div className="border-b border-r border-[#065f46]/10 bg-background p-2.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#647067]">Price</div>
              <div className="text-xs font-semibold text-[#17372d] md:text-sm">{priceDisplay}</div>
            </div>
            <div className="border-b border-r border-[#065f46]/10 bg-background p-2.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#647067]">Market Cap</div>
              <div className="text-xs font-semibold text-[#17372d] md:text-sm">{mcDisplay}</div>
            </div>
            <div className="border-b border-r border-[#065f46]/10 bg-background p-2.5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#647067]">Liquidity</div>
              <div className="text-xs font-semibold text-[#17372d] md:text-sm">{liqDisplay}</div>
            </div>
            <div className="border-b border-r border-[#065f46]/10 bg-background px-2.5 py-2 text-sm">
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#647067]">1h</div>
              <div className={`-space-y-0.5 text-sm ${pctColor(change1hStr)}`}>{change1hStr}</div>
            </div>
            <div className="border-b border-r border-[#065f46]/10 bg-background px-2.5 py-2 text-sm">
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#647067]">6h</div>
              <div className={`-space-y-0.5 text-sm ${pctColor(change6hStr)}`}>{change6hStr}</div>
            </div>
            <div className="border-b border-r border-[#065f46]/10 bg-background px-2.5 py-2 text-sm">
              <div className="text-[10px] font-medium uppercase tracking-wider text-[#647067]">24h</div>
              <div className={`-space-y-0.5 text-sm ${pctColor(change24hStr)}`}>{change24hStr}</div>
            </div>
          </div>

          {/* Mode A renders a leveraged-NAV chart rebased to launch.
              Mode B embeds DexScreener's chart for the pump.fun pair (real
              OHLCV from a Solana-wide indexer). */}
          {item?.source === "pump" ? (
            <PumpPortalChart
              mint={slug}
              symbol={token.symbol}
              solPriceUsd={solPriceUsd}
            />
          ) : (
            <TokenChart
              coin={coin}
              leverageBps={leverageBps}
              direction={launchDirection}
              launchTs={launchTs}
              mcAtLaunchUsd={mcUsd}
              hasTradedYet={hasTradedYet}
            />
          )}

          {isLive ? (
            <PerpPositionPanel
              coin={coin}
              leverageBps={leverageBps ?? 0}
              direction={launchDirection}
              launchTs={launchTs}
              symbol={token.symbol}
              source={item?.source === "pump" ? "pump" : "perp"}
              hasTradedYet={hasTradedYet}
            />
          ) : null}

          {isLive && item?.source === "perp" && liveActivity ? (
            <PendingTxPanel activity={liveActivity} />
          ) : null}

          {isLive && item?.source === "perp" ? (
            <RefillLogPanel refills={refills ?? []} solPriceUsd={solPriceUsd} />
          ) : null}

          <div className="border-t border-[#065f46]/10 px-4 py-3 md:border-b md:border-t-0 md:px-6">
            <div className="mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-[#7a827b]">
              <Shield size={14} className="text-[#f0b90b]" />
              <span>Token Audit</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {token.audit.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2 py-1.5 text-xs">
                  <span className="border-b border-dashed border-[#065f46]/25 font-medium tracking-wide text-[#647067]">
                    {item.label}
                  </span>
                  <span className="flex items-center gap-1.5 font-medium text-[#17372d]">
                    {item.value}
                    {item.status === "good" ? <span className="text-[#18dd73]">✓</span> : null}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-10 p-4 md:p-8">
            <div className="space-y-2">
              <h2 className="text-base font-bold text-[#17372d] md:text-2xl">Overview</h2>
              <p className="space-y-1 text-xs leading-relaxed text-[#6b756d] md:text-sm">{token.description}</p>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#17372d] md:text-2xl">FAQ</h2>
              <FaqAccordion />
            </div>
            <div className="border-t border-[#065f46]/10 pt-6 text-xs text-[#6b756d] md:text-sm">
              longyourlongs.fun is an interface for interacting with decentralized protocols.
              Token launches are conducted by third parties; we don&apos;t issue or endorse tokens.
            </div>
          </div>
        </section>

        <aside className="h-full max-w-xl px-4 py-4 md:px-6 md:py-2 lg:col-span-5">
          <section className="my-4 lg:sticky lg:top-4 space-y-4">
            {isLive ? (
              <TradePanel tokenAddress={slug} tokenSymbol={token.symbol} />
            ) : (
              <div className="rounded-md border border-[#065f46]/15 p-4 text-sm text-[#6b756d]">
                Trade panel only available for live launches. This is mock data.
              </div>
            )}

            {/* Creator rewards only apply to Mode B (pump.fun-routed). For
                Mode A the 1% fee flows entirely to the bridge cranker for ops
                costs — there's no creator allocation. */}
            {item?.source === "pump" ? (
              <div className="space-y-2.5 rounded-md border border-[#065f46]/10 bg-white/3 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-[#8b8b95] md:text-sm">Creator Rewards</p>
                </div>
                <div className="inline-flex flex-wrap items-center gap-2">
                  <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-[#232327] leading-none">
                    <User size={16} className="text-[#8b8b95]" />
                  </div>
                  <h3 className="text-xs font-medium capitalize text-[#17372d] md:text-sm">{token.creator}</h3>
                </div>
                <div className="space-y-3 text-xs text-[#8b8b95]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">Total rewards</p>
                    <p className="font-semibold tabular-nums text-[#17372d]">{token.creatorRewards}</p>
                  </div>
                </div>
              </div>
            ) : null}

            {(liveActivity && liveActivity.length > 0) || token.activity.length > 0 ? (
              <div className="border-t border-dashed border-[#065f46]/15 pt-3">
                <h3 className="-mb-1 text-xs font-semibold text-[#8b8b95] md:text-sm">Recent Activity</h3>
                <div className="divide-y divide-dashed divide-[#065f46]/10">
                  {(liveActivity ?? []).map((ev) => (
                    <div key={ev.signature} className="flex items-start justify-between gap-1 py-3">
                      <div className="space-y-0.5">
                        <span className="font-mono text-sm text-[#8b8b95]">
                          {ev.signer.slice(0, 4)}...{ev.signer.slice(-4)}
                        </span>
                        <a
                          href={`https://solscan.io/tx/${ev.signature}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-medium tabular-nums text-[#8b8b95]/50 hover:text-[#8b8b95]"
                        >
                          {ev.blockTime ? new Date(ev.blockTime * 1000).toLocaleString() : "—"}
                          <ArrowSquareOut size={12} />
                        </a>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className={
                          ev.kind === "buy"
                            ? "font-mono text-sm font-medium tabular-nums text-[#18dd73]"
                            : ev.kind === "sell"
                            ? "font-mono text-sm font-medium tabular-nums text-[#ff5f5f]"
                            : "font-mono text-sm font-medium tabular-nums text-[#8b8b95]"
                        }>
                          {ev.kind}
                        </span>
                      </div>
                    </div>
                  ))}
                  {!liveActivity || liveActivity.length === 0 ? token.activity.map((item) => (
                    <div key={`${item.wallet}-${item.timestamp}`} className="flex items-start justify-between gap-1 py-3 opacity-60">
                      <div className="space-y-0.5">
                        <span className="font-mono text-sm text-[#8b8b95]">{item.wallet}</span>
                        <span className="block text-xs font-medium tabular-nums text-[#8b8b95]/50">{item.timestamp} (mock)</span>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className={item.side === "Bought" ? "font-mono text-sm font-medium tabular-nums text-[#18dd73]" : "font-mono text-sm font-medium tabular-nums text-[#ff5f5f]"}>
                          {item.amount}
                        </span>
                      </div>
                    </div>
                  )) : null}
                </div>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
