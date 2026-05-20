"use client";

import { ArrowDown, ArrowSquareOut, ArrowUp, Coins, Lightning } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import {
  fetchClearinghouseState,
  type ClearinghouseState,
  type HyperliquidPosition,
} from "@/lib/altsol/hyperliquid";

type Direction = "long" | "short";

// HyperEVM manager address — links open the manager's live L1 perp positions
// so anyone can verify fees are actually being deposited / leveraged.
const HYPEREVM_MANAGER = "0x1ddf514644fc66492d39fcb6a452cdcb2a5bf3d5";
// Minimum USD of accumulated creator fees the harvester needs before it
// will bridge to Hyperliquid (mirrors MIN_HARVEST_USD on the daemon).
const MIN_HARVEST_USD = 3;

interface Candle {
  t: number;
  o: string;
  c: string;
}

async function fetchEntryAndMark(
  coin: string,
  launchTs?: number,
): Promise<{ entry: number; mark: number } | null> {
  // Pull a recent window of candles to derive entry (at or after launchTs) and
  // the current mark (last close).
  const now = Date.now();
  const lookbackMs = launchTs
    ? Math.max(now - launchTs * 1000, 60 * 60 * 1000) + 60 * 60 * 1000
    : 48 * 60 * 60 * 1000;
  const res = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "candleSnapshot",
      req: {
        coin,
        interval: "15m",
        startTime: now - lookbackMs,
        endTime: now,
      },
    }),
  });
  if (!res.ok) return null;
  const candles = (await res.json()) as Candle[];
  if (!candles.length) return null;
  const entryCandle = launchTs
    ? candles.find((c) => Math.floor(c.t / 1000) >= launchTs) ?? candles[0]
    : candles[0];
  return {
    entry: parseFloat(entryCandle.o),
    mark: parseFloat(candles[candles.length - 1].c),
  };
}

function formatUsd(px: number, digits = 2): string {
  if (!Number.isFinite(px) || px <= 0) return "—";
  return `$${px.toLocaleString(undefined, { maximumFractionDigits: digits })}`;
}

export function PerpPositionPanel({
  coin,
  leverageBps,
  direction,
  launchTs,
  symbol,
  source = "perp",
  hasTradedYet = true,
}: {
  coin: string;
  leverageBps: number;
  direction: Direction;
  launchTs?: number;
  symbol: string;
  /** "perp" = Mode A (immediate proportional perp). "pump" = Mode B (fees harvest periodically). */
  source?: "perp" | "pump";
  /** Mode A only: false until the first on-chain buy. When false, the panel
   *  shows an "awaiting first buy" state instead of synthesizing entry/mark/PnL
   *  from BTC candles. Defaults to true so existing callers don't break. */
  hasTradedYet?: boolean;
}) {
  const leverage = leverageBps / 10_000;
  const [state, setState] = useState<{ entry: number; mark: number } | null>(null);
  const [livePos, setLivePos] = useState<HyperliquidPosition | null>(null);
  const [managerSummary, setManagerSummary] = useState<
    ClearinghouseState["marginSummary"] | null
  >(null);
  const [withdrawable, setWithdrawable] = useState<number>(0);

  useEffect(() => {
    let active = true;
    async function load() {
      // Two parallel calls:
      //   1. Candle-based entry/mark (per-launch approximation when no live
      //      position exists yet — typical for fresh launches still bridging).
      //   2. The manager wallet's actual clearinghouseState — the real
      //      aggregated position on Hyperliquid for this coin. When present,
      //      its fields (entryPx, unrealizedPnl, liquidationPx, leverage)
      //      override the candle estimate.
      const [candle, ch] = await Promise.all([
        fetchEntryAndMark(coin, launchTs).catch(() => null),
        fetchClearinghouseState(HYPEREVM_MANAGER as `0x${string}`).catch(() => null),
      ]);
      if (!active) return;
      if (candle) setState(candle);
      const match = ch?.assetPositions.find((p) => p.position.coin === coin);
      setLivePos(match?.position ?? null);
      setManagerSummary(ch?.marginSummary ?? null);
      setWithdrawable(ch ? Number(ch.withdrawable ?? 0) : 0);
    }
    load();
    const id = setInterval(load, 15_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [coin, launchTs]);

  const isLong = direction === "long";
  const sign = isLong ? 1 : -1;

  // Real values from Hyperliquid override the candle approximation.
  const liveEntry = livePos ? Number(livePos.entryPx) : 0;
  const livePnlUsd = livePos ? Number(livePos.unrealizedPnl) : 0;
  const liveNotional = livePos ? Math.abs(Number(livePos.positionValue)) : 0;
  const liveSize = livePos ? Number(livePos.szi) : 0;
  const liveLiq = livePos?.liquidationPx ? Number(livePos.liquidationPx) : 0;
  const liveLeverage = livePos?.leverage?.value ?? leverage;

  const entry = liveEntry > 0 ? liveEntry : state?.entry ?? 0;
  const mark = state?.mark ?? 0;

  // Percent move: prefer live PnL if available, else candle approximation.
  const pctMove = livePos
    ? liveNotional > 0
      ? (livePnlUsd / liveNotional) * 100 * liveLeverage
      : 0
    : state && state.entry > 0
      ? sign * leverage * (state.mark / state.entry - 1) * 100
      : 0;
  const positive = pctMove >= 0;

  // Liquidation: prefer Hyperliquid-reported, fall back to cross-margin approx.
  const liq =
    liveLiq > 0
      ? liveLiq
      : state && leverage > 0
        ? isLong
          ? state.entry * (1 - 1 / leverage)
          : state.entry * (1 + 1 / leverage)
        : 0;

  const explorerHref = `https://app.hyperliquid.xyz/explorer/address/${HYPEREVM_MANAGER}`;
  const hyperdashHref =
    "https://hyperdash.com/address/0x1ddf514644fc66492d39fcb6a452cdcb2a5bf3d5";

  // Mode B: no proportional perp opens per-trade. Fees harvested from pump.fun
  // accumulate on the LYL PDA's creator vault; once they cross MIN_HARVEST_USD
  // the harvester bot bridges them to Hyperliquid and grows the perp.
  if (source === "pump") {
    return (
      <div className="border-b border-[#065f46]/10 px-4 py-3 md:px-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-[#7a827b]">
            <Coins size={14} className="text-[#065f46]" />
            <span>pump.fun creator fees → perp</span>
          </div>
          <a
            href={hyperdashHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-[#065f46] hover:underline"
          >
            view manager on hyperdash
            <ArrowSquareOut size={11} />
          </a>
        </div>
        <div className="overflow-hidden rounded-md border border-[#f0b90b]/40 bg-[#fff7d6] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#946700]">
            accumulating fees
          </div>
          <div className="mt-1 text-sm font-bold text-[#17372d]">
            Perp position not opened yet
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-[#3b4a44]">
            This is a Mode B launch. Every trade on pump.fun pays 5bps in creator fees
            to our PDA. Once accumulated fees cross ~${MIN_HARVEST_USD} the harvester bridges them
            to Hyperliquid and adds to a {leverage > 0 ? `${leverage}x ` : ""}{direction} {coin} perp on the LYL manager.
            Smaller pools take longer to accumulate.{" "}
            <a
              href="/docs#bridge"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#946700] underline decoration-dotted underline-offset-2"
            >
              why?
            </a>
          </p>
        </div>
        <p className="mt-2 text-[11px] text-[#6f857c]">
          Manager address: <a href={hyperdashHref} target="_blank" rel="noopener noreferrer" className="font-mono text-[#065f46] underline decoration-dotted underline-offset-2">{HYPEREVM_MANAGER.slice(0, 6)}…{HYPEREVM_MANAGER.slice(-4)}</a>
          {" "}— verify fees / open positions live.
        </p>
      </div>
    );
  }

  // Mode A "awaiting first buy" state — fires when the launch has no recorded
  // trades AND no matching position lives on the Hyperliquid manager. Stops us
  // from rendering synthetic entry/mark/PnL derived from BTC candle data
  // before any buy has actually happened.
  if (source === "perp" && !hasTradedYet && !livePos) {
    return (
      <div className="border-b border-[#065f46]/10 px-4 py-3 md:px-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-[#7a827b]">
            <Lightning size={14} className="text-[#065f46]" />
            <span>perp position</span>
          </div>
          <a
            href={hyperdashHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-[#065f46] hover:underline"
          >
            view manager on hyperdash
            <ArrowSquareOut size={11} />
          </a>
        </div>
        <div className="overflow-hidden rounded-md border border-[#f0b90b]/40 bg-[#fff7d6] px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#946700]">
            awaiting first buy
          </div>
          <div className="mt-1 text-sm font-bold text-[#17372d]">
            No buys or sells yet
          </div>
          <p className="mt-1 text-[12px] leading-relaxed text-[#3b4a44]">
            The first buy on this launch will open a {leverage}x {direction} {coin} perp on the
            LYL manager via deBridge. Bridge round-trip is ~30-60s, then this panel will populate
            with the real entry, mark, and unrealized PnL straight from Hyperliquid.
          </p>
        </div>
        <p className="mt-2 text-[11px] text-[#6f857c]">
          Manager address:{" "}
          <a
            href={hyperdashHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[#065f46] underline decoration-dotted underline-offset-2"
          >
            {HYPEREVM_MANAGER.slice(0, 6)}…{HYPEREVM_MANAGER.slice(-4)}
          </a>
          {" "}— positions will appear live after first bridge settles.
        </p>
      </div>
    );
  }

  return (
    <div className="border-b border-[#065f46]/10 px-4 py-3 md:px-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-[#7a827b]">
          <Lightning size={14} className="text-[#065f46]" />
          <span>perp position</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#6f857c]">
          <a
            href={hyperdashHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#065f46] hover:underline"
          >
            view on hyperdash
            <ArrowSquareOut size={11} />
          </a>
          <span className="inline-flex items-center gap-1">
            <span aria-hidden className="inline-block size-1.5 rounded-full bg-[#10b981] animate-pulse" />
            live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 overflow-hidden rounded-md border border-[#065f46]/15 bg-[#fffaf3] md:grid-cols-12">
        {/* Side / leverage chip */}
        <div className="flex items-center gap-3 border-b border-[#065f46]/10 p-3 md:col-span-3 md:border-b-0 md:border-r">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://app.hyperliquid.xyz/coins/${coin}.svg`}
            alt=""
            width={32}
            height={32}
            className="size-8 rounded-full"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#17372d]">{coin}-PERP</span>
              <span
                className={`inline-flex items-center gap-0.5 rounded-sm px-1.5 py-[1px] text-[10px] font-bold uppercase ${isLong ? "bg-[#065f46]/12 text-[#065f46]" : "bg-[#b42318]/12 text-[#b42318]"}`}
              >
                {isLong ? <ArrowUp size={9} weight="bold" /> : <ArrowDown size={9} weight="bold" />}
                {direction}
              </span>
              <span className="rounded-sm bg-[#17372d] px-1.5 py-[1px] text-[10px] font-bold text-white">
                {leverage}x
              </span>
            </div>
            <div className="mt-0.5 truncate text-[11px] text-[#6f857c]">backs {symbol}</div>
          </div>
        </div>

        {/* Entry / mark / pnl */}
        <Stat label="Entry" value={formatUsd(entry)} span="md:col-span-2" />
        <Stat label="Mark" value={formatUsd(mark)} span="md:col-span-2" />
        <Stat
          label={livePos ? "Unrealized PnL" : "Est. PnL"}
          value={
            livePos
              ? `${positive ? "+" : ""}${formatUsd(Math.abs(livePnlUsd))}${pctMove !== 0 ? ` (${positive ? "+" : ""}${pctMove.toFixed(2)}%)` : ""}`
              : state
                ? `${positive ? "+" : ""}${pctMove.toFixed(2)}%`
                : "—"
          }
          valueClass={positive ? "text-[#065f46]" : "text-[#b42318]"}
          span="md:col-span-2"
        />
        <Stat
          label={livePos ? "Liq price" : "Est. liq"}
          value={liq > 0 ? formatUsd(liq) : "—"}
          valueClass="text-[#b42318]"
          span="md:col-span-3"
        />
      </div>

      {livePos ? (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6f857c]">
          <span>
            Aggregate position on manager:{" "}
            <span className="font-bold tabular-nums text-[#17372d]">
              {Math.abs(liveSize).toLocaleString(undefined, { maximumFractionDigits: 4 })} {coin}
            </span>
            {" · "}notional{" "}
            <span className="font-bold tabular-nums text-[#17372d]">{formatUsd(liveNotional)}</span>
            {" · "}leverage{" "}
            <span className="font-bold tabular-nums text-[#17372d]">{liveLeverage}x</span>
          </span>
          <span className="text-[10px]">aggregated across all LYL {coin} launches</span>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-[#6f857c]">
          Token NAV moves at {leverage}× the underlying. Liquidation is approximate (cross-margin,
          ignores maintenance buffer). Position values resolve from Hyperliquid once the bridge
          settles.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  valueClass = "text-[#17372d]",
  span = "md:col-span-2",
}: {
  label: string;
  value: string;
  valueClass?: string;
  span?: string;
}) {
  return (
    <div className={`border-b border-[#065f46]/10 p-3 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 ${span}`}>
      <div className="text-[10px] font-medium uppercase tracking-wider text-[#647067]">
        {label}
      </div>
      <div className={`mt-0.5 text-sm font-bold tabular-nums ${valueClass}`}>{value}</div>
    </div>
  );
}
