"use client";

import { ArrowSquareOut } from "@phosphor-icons/react";
import {
  type CandlestickData,
  CandlestickSeries,
  ColorType,
  createChart,
  type HistogramData,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";

type PumpCandle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

type PumpQuote = {
  priceUsd: number;
  marketCapUsd: number;
  lastTradeTimestamp: number;
};

type ChartStatus = "loading" | "live" | "no-data" | "error";

function fmtPrice(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(4)}`;
  if (n >= 0.000001) return `$${n.toFixed(8)}`;
  return `$${n.toExponential(3)}`;
}

function fmtVolume(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`;
  return n.toFixed(2);
}

function toUtc(ts: number): UTCTimestamp {
  return ts as UTCTimestamp;
}

function normalizeTimestamp(ts: number): number {
  return ts > 10_000_000_000 ? Math.floor(ts / 1000) : Math.floor(ts);
}

function candleSeriesData(
  candles: PumpCandle[],
): CandlestickData<UTCTimestamp>[] {
  return candles.map((c) => ({
    time: toUtc(c.t),
    open: c.o,
    high: c.h,
    low: c.l,
    close: c.c,
  }));
}

function volumeSeriesData(
  candles: PumpCandle[],
): HistogramData<UTCTimestamp>[] {
  return candles.map((c) => ({
    time: toUtc(c.t),
    value: c.v,
    color: c.c >= c.o ? "rgba(34, 197, 94, 0.7)" : "rgba(239, 68, 68, 0.75)",
  }));
}

function mergeLiveQuote(candles: PumpCandle[], quote: PumpQuote): PumpCandle[] {
  if (
    candles.length === 0 ||
    quote.priceUsd <= 0 ||
    quote.lastTradeTimestamp <= 0
  ) {
    return candles;
  }

  const next = [...candles];
  const tsSec = normalizeTimestamp(quote.lastTradeTimestamp);
  const bucketTs = Math.floor(tsSec / 60) * 60;
  const last = next[next.length - 1];

  if (bucketTs < last.t) {
    return next;
  }

  if (bucketTs === last.t) {
    next[next.length - 1] = {
      ...last,
      h: Math.max(last.h, quote.priceUsd),
      l: Math.min(last.l, quote.priceUsd),
      c: quote.priceUsd,
    };
    return next;
  }

  next.push({
    t: bucketTs,
    o: last.c,
    h: Math.max(last.c, quote.priceUsd),
    l: Math.min(last.c, quote.priceUsd),
    c: quote.priceUsd,
    v: 0,
  });
  return next.slice(-500);
}

export default function PumpPortalChart({
  mint,
  symbol,
  solPriceUsd: _solPriceUsd,
}: {
  mint: string;
  symbol: string;
  solPriceUsd: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const candlesRef = useRef<PumpCandle[]>([]);
  const [status, setStatus] = useState<ChartStatus>("loading");
  const [candles, setCandles] = useState<PumpCandle[]>([]);
  const [lastQuote, setLastQuote] = useState<PumpQuote | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      height: 360,
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
        scaleMargins: { top: 0.08, bottom: 0.22 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
        barSpacing: 14,
        minBarSpacing: 6,
        rightOffset: 4,
        fixLeftEdge: true,
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
      priceFormat: {
        type: "custom",
        formatter: (n: number) => fmtPrice(n),
        minMove: 0.00000001,
      },
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.72, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCandles() {
      try {
        const response = await fetch(
          `/api/pumpfun-candles/${mint}?interval=1m`,
        );
        if (!response.ok) {
          if (!cancelled) setStatus("error");
          return;
        }

        const data = (await response.json()) as { candles?: PumpCandle[] };
        if (cancelled) return;

        const nextCandles = (data.candles ?? [])
          .filter(
            (c) =>
              Number.isFinite(c.t) &&
              Number.isFinite(c.o) &&
              Number.isFinite(c.h) &&
              Number.isFinite(c.l) &&
              Number.isFinite(c.c) &&
              Number.isFinite(c.v),
          )
          .sort((a, b) => a.t - b.t)
          .slice(-500);

        candlesRef.current = nextCandles;
        setCandles(nextCandles);

        candleSeriesRef.current?.setData(candleSeriesData(nextCandles));
        volumeSeriesRef.current?.setData(volumeSeriesData(nextCandles));

        if (nextCandles.length === 0) {
          setStatus("no-data");
          return;
        }

        chartRef.current?.timeScale().fitContent();
        setStatus("live");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    void loadCandles();
    const intervalId = window.setInterval(loadCandles, 15_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [mint]);

  useEffect(() => {
    let cancelled = false;

    async function loadQuote() {
      try {
        const response = await fetch(`/api/pumpfun-quote/${mint}`);
        if (!response.ok) return;

        const quote = (await response.json()) as PumpQuote;
        if (
          cancelled ||
          !Number.isFinite(quote.priceUsd) ||
          quote.priceUsd <= 0
        ) {
          return;
        }

        setLastQuote(quote);

        const merged = mergeLiveQuote(candlesRef.current, quote);
        if (merged === candlesRef.current || merged.length === 0) {
          if (candlesRef.current.length > 0) setStatus("live");
          return;
        }

        candlesRef.current = merged;
        setCandles(merged);
        candleSeriesRef.current?.setData(candleSeriesData(merged));
        volumeSeriesRef.current?.setData(volumeSeriesData(merged));
        setStatus("live");
      } catch {}
    }

    void loadQuote();
    const intervalId = window.setInterval(loadQuote, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [mint]);

  const latestCandle = candles[candles.length - 1] ?? null;
  const pctChange = useMemo(() => {
    if (!latestCandle || latestCandle.o <= 0) return 0;
    return ((latestCandle.c - latestCandle.o) / latestCandle.o) * 100;
  }, [latestCandle]);
  const pctPositive = pctChange >= 0;

  return (
    <div className="relative w-full overflow-hidden border-y border-white/8 bg-[#0f0f11]">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/8 px-4 py-3 text-[12px] text-[#b7b7bf]">
        <span className="font-bold text-white">{symbol}/USD</span>
        <span className="text-[#7a827b]">·</span>
        <span>1m · pump.fun</span>
        {latestCandle ? (
          <span className="ml-2 inline-flex items-center gap-2 tabular-nums">
            <span className="text-[#7a827b]">O</span>
            <span>{fmtPrice(latestCandle.o)}</span>
            <span className="text-[#7a827b]">H</span>
            <span>{fmtPrice(latestCandle.h)}</span>
            <span className="text-[#7a827b]">L</span>
            <span>{fmtPrice(latestCandle.l)}</span>
            <span className="text-[#7a827b]">C</span>
            <span>{fmtPrice(latestCandle.c)}</span>
            <span className={pctPositive ? "text-[#20d6b0]" : "text-[#ff4d57]"}>
              {pctPositive ? "+" : ""}
              {pctChange.toFixed(2)}%
            </span>
          </span>
        ) : null}
        {latestCandle ? (
          <span className="inline-flex items-center gap-2 tabular-nums">
            <span className="text-[#7a827b]">Vol</span>
            <span className="text-[#20d6b0]">{fmtVolume(latestCandle.v)}</span>
          </span>
        ) : null}
        <a
          href={`https://pump.fun/coin/${mint}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#20d6b0] hover:underline"
        >
          pump.fun
          <ArrowSquareOut size={11} />
        </a>
        <span className="ml-auto flex items-center gap-3">
          <span
            className={status === "live" ? "text-[#20d6b0]" : "text-[#8b8b95]"}
          >
            {status === "loading" && "loading"}
            {status === "live" && "● live from pump.fun"}
            {status === "no-data" && "no candle data yet"}
            {status === "error" && "pump.fun unavailable"}
          </span>
          {lastQuote?.marketCapUsd ? (
            <span className="tabular-nums">
              MC {fmtPrice(lastQuote.marketCapUsd)}
            </span>
          ) : latestCandle ? (
            <span className="tabular-nums">{fmtPrice(latestCandle.c)}</span>
          ) : null}
        </span>
      </div>
      <div className="relative h-[420px]">
        <div ref={containerRef} className="h-full w-full" />
        {status !== "live" ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#0f0f11]/85 text-center text-[13px] text-[#b7b7bf]">
            <div>
              {status === "loading" && "loading pump.fun candles"}
              {status === "no-data" && (
                <>
                  no pump.fun candles for this token yet.
                  <br />
                  the chart will appear once pump.fun has market activity.
                </>
              )}
              {status === "error" && "couldn’t load pump.fun chart data"}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
