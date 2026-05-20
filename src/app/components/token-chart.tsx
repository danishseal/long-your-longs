"use client";

import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useRef, useState } from "react";

interface HLCandle {
  t: number; T: number; s: string; i: string;
  o: string; c: string; h: string; l: string; v: string; n: number;
}

async function fetchHyperliquidCandles(coin: string, lookbackHours = 48): Promise<HLCandle[]> {
  const now = Date.now();
  const res = await fetch("https://api.hyperliquid.xyz/info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "candleSnapshot",
      req: { coin, interval: "15m", startTime: now - lookbackHours * 60 * 60 * 1000, endTime: now },
    }),
  });
  if (!res.ok) return [];
  return (await res.json()) as HLCandle[];
}

const candleData = [
  {
    time: 1715966400 as UTCTimestamp,
    open: 18.4,
    high: 22.5,
    low: 17.8,
    close: 20.7,
  },
  {
    time: 1715970000 as UTCTimestamp,
    open: 20.7,
    high: 83.2,
    low: 4.1,
    close: 25.4,
  },
  {
    time: 1715973600 as UTCTimestamp,
    open: 25.4,
    high: 31.2,
    low: 8.2,
    close: 9.8,
  },
  {
    time: 1715977200 as UTCTimestamp,
    open: 9.8,
    high: 11.8,
    low: 7.2,
    close: 8.6,
  },
  {
    time: 1715980800 as UTCTimestamp,
    open: 8.6,
    high: 10.1,
    low: 7.9,
    close: 9.2,
  },
  {
    time: 1715984400 as UTCTimestamp,
    open: 9.2,
    high: 10.3,
    low: 8.7,
    close: 8.9,
  },
  {
    time: 1715988000 as UTCTimestamp,
    open: 8.9,
    high: 9.6,
    low: 7.1,
    close: 7.5,
  },
  {
    time: 1715991600 as UTCTimestamp,
    open: 7.5,
    high: 8.2,
    low: 6.9,
    close: 7.1,
  },
  {
    time: 1715995200 as UTCTimestamp,
    open: 7.1,
    high: 7.8,
    low: 6.5,
    close: 6.8,
  },
  {
    time: 1715998800 as UTCTimestamp,
    open: 6.8,
    high: 7.1,
    low: 6.2,
    close: 6.5,
  },
];

const volumeData = [
  {
    time: 1715966400 as UTCTimestamp,
    value: 4.3,
    color: "rgba(34, 197, 94, 0.7)",
  },
  {
    time: 1715970000 as UTCTimestamp,
    value: 18.9,
    color: "rgba(239, 68, 68, 0.75)",
  },
  {
    time: 1715973600 as UTCTimestamp,
    value: 26.2,
    color: "rgba(239, 68, 68, 0.75)",
  },
  {
    time: 1715977200 as UTCTimestamp,
    value: 7.4,
    color: "rgba(34, 197, 94, 0.7)",
  },
  {
    time: 1715980800 as UTCTimestamp,
    value: 6.1,
    color: "rgba(34, 197, 94, 0.7)",
  },
  {
    time: 1715984400 as UTCTimestamp,
    value: 4.7,
    color: "rgba(239, 68, 68, 0.75)",
  },
  {
    time: 1715988000 as UTCTimestamp,
    value: 4.2,
    color: "rgba(239, 68, 68, 0.75)",
  },
  {
    time: 1715991600 as UTCTimestamp,
    value: 3.6,
    color: "rgba(239, 68, 68, 0.75)",
  },
  {
    time: 1715995200 as UTCTimestamp,
    value: 3.1,
    color: "rgba(239, 68, 68, 0.75)",
  },
  {
    time: 1715998800 as UTCTimestamp,
    value: 2.9,
    color: "rgba(239, 68, 68, 0.75)",
  },
];

interface TokenChartProps {
  coin?: string;
  /** 10000 = 1x, 30000 = 3x. If omitted, raw perp chart is shown. */
  leverageBps?: number;
  direction?: "long" | "short";
  /** Unix seconds. If provided, the candle at launchTs anchors entry. */
  launchTs?: number;
  /** Token's market cap in USD at launch — used to scale Y-axis to dollars. */
  mcAtLaunchUsd?: number;
  /** When false (Mode A only), skip the candle render and show "no trades
   *  yet" — we don't want to display synthetic NAV derived from BTC's recent
   *  candles before any actual buy has happened. Defaults to true. */
  hasTradedYet?: boolean;
}

export default function TokenChart({
  coin = "BTC",
  leverageBps,
  direction = "long",
  launchTs,
  mcAtLaunchUsd,
  hasTradedYet = true,
}: TokenChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const [lastCandle, setLastCandle] = useState<HLCandle | null>(null);
  const [lastMc, setLastMc] = useState<number | null>(null);

  const leverage = leverageBps ? leverageBps / 10_000 : 0;
  const isLeveraged = leverage > 0;
  const showMcUsd = isLeveraged && (mcAtLaunchUsd ?? 0) > 0;

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const chart = createChart(container, {
      autoSize: true,
      height: 404,
      layout: {
        background: { type: ColorType.Solid, color: "#0f0f11" },
        textColor: "#8b8b95",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)", style: 2 },
        horzLines: { color: "rgba(255,255,255,0.04)", style: 2 },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
        scaleMargins: { top: 0.08, bottom: 0.18 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.18)", width: 1, style: 2 },
        horzLine: { color: "rgba(255,255,255,0.18)", width: 1, style: 2 },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#20d6b0",
      downColor: "#ff4d57",
      borderVisible: false,
      wickUpColor: "#20d6b0",
      wickDownColor: "#ff4d57",
      priceLineVisible: false,
      lastValueVisible: false,
    });

    candleSeries.setData(candleData);

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.72, bottom: 0 },
    });
    volumeSeries.setData(volumeData);

    chart.timeScale().fitContent();

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Try to replace mock data with real Hyperliquid candles for this perp.
    let cancelled = false;
    // Skip the candle fetch entirely when the launch hasn't traded yet — we
    // don't want to render a synthetic leveraged-NAV chart derived from BTC
    // movement when no buy has actually opened a position.
    if (!hasTradedYet) {
      return () => { cancelled = true; chart.remove(); chartRef.current = null; candleSeriesRef.current = null; };
    }
    fetchHyperliquidCandles(coin).then((rawCandles) => {
      if (cancelled || rawCandles.length === 0) return;

      // When showing a leveraged NAV view, drop candles older than the launch:
      // pre-launch BTC noise transformed by leverage misleads users.
      const candles =
        isLeveraged && launchTs
          ? rawCandles.filter((c) => Math.floor(c.t / 1000) >= launchTs)
          : rawCandles;
      if (candles.length === 0) return;

      // Pick the entry candle. If launchTs is provided, anchor on the first
      // candle at or after launch; else use the first candle in the window.
      const entryCandle = launchTs
        ? candles.find((c) => Math.floor(c.t / 1000) >= launchTs) ?? candles[0]
        : candles[0];
      const entry = parseFloat(entryCandle.o);
      // Sign flips for short positions.
      const sign = direction === "short" ? -1 : 1;

      const transform = (px: number): number => {
        if (!isLeveraged || entry <= 0) return px;
        const m = 1 + sign * leverage * (px / entry - 1);
        const clamped = Math.max(m, 0.0001);
        // If we know the USD MC at launch, plot the chart in dollars instead
        // of the unitless 1.0=launch multiplier.
        if (mcAtLaunchUsd && mcAtLaunchUsd > 0) {
          return clamped * mcAtLaunchUsd;
        }
        return clamped;
      };

      const data = candles.map((c) => ({
        time: Math.floor(c.t / 1000) as UTCTimestamp,
        open: transform(parseFloat(c.o)),
        high: transform(parseFloat(c.h)),
        low: transform(parseFloat(c.l)),
        close: transform(parseFloat(c.c)),
      }));
      candleSeries.setData(data);
      const vol = candles.map((c) => ({
        time: Math.floor(c.t / 1000) as UTCTimestamp,
        value: parseFloat(c.v),
        color: parseFloat(c.c) >= parseFloat(c.o) ? "rgba(34, 197, 94, 0.7)" : "rgba(239, 68, 68, 0.75)",
      }));
      volumeSeries.setData(vol);
      chart.timeScale().fitContent();
      setLastCandle(candles[candles.length - 1]);
      if (isLeveraged) {
        setLastMc(transform(parseFloat(candles[candles.length - 1].c)));
      }
    });

    return () => {
      cancelled = true;
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [coin]);

  // Pct move since launch (only meaningful for leveraged view).
  const pctSinceLaunch =
    showMcUsd && lastMc !== null && mcAtLaunchUsd
      ? (lastMc / mcAtLaunchUsd - 1) * 100
      : null;
  const navUp = pctSinceLaunch !== null ? pctSinceLaunch >= 0 : true;

  const fmtMc = (n: number): string => {
    if (!Number.isFinite(n) || n <= 0) return "—";
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
    return `$${n.toFixed(2)}`;
  };

  if (!hasTradedYet) {
    return (
      <div className="relative h-[260px] w-full overflow-hidden border-y border-white/8 bg-[#0f0f11]">
        <div className="border-b border-white/8 px-4 py-3 text-sm text-[#b7b7bf]">
          <div className="flex items-center gap-4">
            <span>1m</span>
            <span>
              {isLeveraged ? (
                <>token MC · {coin} × {leverage}x {direction}</>
              ) : (
                <>{coin}-PERP</>
              )}
            </span>
            <span className="ml-auto text-[#7a827b]">no trades yet</span>
          </div>
        </div>
        <div className="flex h-[calc(100%-49px)] items-center justify-center text-center text-[13px] text-[#8b8b95]">
          <div>
            no buys or sells yet on this launch.<br />
            the chart populates with real data after the first trade
            {launchTs ? ` (launched ${Math.max(0, Math.round((Date.now()/1000 - launchTs)/60))}m ago)` : ""}.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[420px] w-full overflow-hidden border-y border-white/8">
      <div className="border-b border-white/8 px-4 py-3 text-sm text-[#b7b7bf]">
        <div className="flex items-center gap-4">
          <span>15m</span>
          <span>
            {showMcUsd ? (
              <>token MC · {coin} × {leverage}x {direction}</>
            ) : isLeveraged ? (
              <>token NAV · {coin} × {leverage}x {direction}</>
            ) : (
              <>{coin}-PERP</>
            )}
          </span>
          <span className="ml-auto flex items-center gap-3">
            {pctSinceLaunch !== null ? (
              <span className={navUp ? "text-[#20d6b0]" : "text-[#ff4d57]"}>
                {navUp ? "+" : ""}{pctSinceLaunch.toFixed(2)}%
              </span>
            ) : null}
            <span>
              {showMcUsd && lastMc !== null
                ? fmtMc(lastMc)
                : lastCandle
                  ? `$${parseFloat(lastCandle.c).toLocaleString()}`
                  : "loading..."}
            </span>
          </span>
        </div>
      </div>
      <div className="absolute inset-x-0 top-[49px] bottom-4">
        <div className="absolute left-4 top-3 z-10 text-sm text-white/85">
          {showMcUsd ? (
            <>market cap · {coin} × {leverage}x {direction} · 15m</>
          ) : isLeveraged ? (
            <>NAV · {coin} × {leverage}x {direction} · 15m</>
          ) : (
            <>{coin} · Hyperliquid · 15m</>
          )}
        </div>
        <div className="absolute left-4 top-9 z-10 text-xs text-[#8b8b95]">
          {showMcUsd
            ? `launch MC ${fmtMc(mcAtLaunchUsd!)}`
            : isLeveraged
              ? "1.0 = launch"
              : lastCandle
                ? `Vol ${parseFloat(lastCandle.v).toFixed(2)}`
                : ""}
        </div>
        <div ref={containerRef} className="h-full w-full" />
      </div>
      <div className="absolute inset-x-0 bottom-0 flex h-4 items-center justify-center border-t border-white/8 text-[#8b8b95]">
        ...
      </div>
    </div>
  );
}
