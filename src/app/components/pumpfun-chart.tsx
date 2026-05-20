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
import { ArrowSquareOut } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

interface PumpCandle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface PumpFunChartProps {
  mint: string;
  symbol: string;
  /** Display interval. Defaults to 1m. */
  interval?: "1m" | "5m" | "15m" | "1h" | "4h";
}

export default function PumpFunChart({
  mint,
  symbol,
  interval = "1m",
}: PumpFunChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hasData, setHasData] = useState(false);
  const [lastClose, setLastClose] = useState<number | null>(null);

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

    const candleSeries: ISeriesApi<"Candlestick"> = chart.addSeries(
      CandlestickSeries,
      {
        upColor: "#20d6b0",
        downColor: "#ff4d57",
        borderVisible: false,
        wickUpColor: "#20d6b0",
        wickDownColor: "#ff4d57",
        priceLineVisible: false,
        lastValueVisible: false,
      },
    );

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.72, bottom: 0 },
    });

    let cancelled = false;
    let chartRef: IChartApi | null = chart;

    async function load() {
      try {
        const r = await fetch(`/api/pumpfun-candles/${mint}?interval=${interval}`);
        if (!r.ok) return;
        const data = (await r.json()) as { candles?: PumpCandle[] };
        if (cancelled || !data.candles || data.candles.length === 0) return;
        const ohlc = data.candles
          .filter((c) => Number.isFinite(c.o) && Number.isFinite(c.c))
          .map((c) => ({
            time: c.t as UTCTimestamp,
            open: c.o,
            high: c.h,
            low: c.l,
            close: c.c,
          }))
          .sort((a, b) => Number(a.time) - Number(b.time));
        if (ohlc.length === 0) return;
        candleSeries.setData(ohlc);
        const vol = data.candles.map((c) => ({
          time: c.t as UTCTimestamp,
          value: c.v,
          color:
            c.c >= c.o
              ? "rgba(34, 197, 94, 0.7)"
              : "rgba(239, 68, 68, 0.75)",
        }));
        volumeSeries.setData(vol);
        chartRef?.timeScale().fitContent();
        setHasData(true);
        setLastClose(ohlc[ohlc.length - 1].close);
      } catch {}
    }

    void load();
    const id = setInterval(load, 15_000);

    return () => {
      cancelled = true;
      clearInterval(id);
      chart.remove();
      chartRef = null;
    };
  }, [mint, interval]);

  const fmt = (px: number | null): string => {
    if (px === null || !Number.isFinite(px) || px <= 0) return "—";
    if (px >= 1) return `$${px.toFixed(2)}`;
    if (px >= 0.01) return `$${px.toFixed(4)}`;
    if (px >= 0.000001) return `$${px.toFixed(8)}`;
    return `$${px.toExponential(3)}`;
  };

  return (
    <div className="relative h-[420px] w-full overflow-hidden border-y border-white/8">
      <div className="border-b border-white/8 px-4 py-3 text-sm text-[#b7b7bf]">
        <div className="flex items-center gap-4">
          <span>{interval}</span>
          <span>pump.fun · {symbol}</span>
          <a
            href={`https://pump.fun/coin/${mint}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#20d6b0] hover:underline"
          >
            view on pump.fun
            <ArrowSquareOut size={11} />
          </a>
          <span className="ml-auto">{fmt(lastClose)}</span>
        </div>
      </div>
      <div className="absolute inset-x-0 top-[49px] bottom-0">
        <div className="absolute left-4 top-3 z-10 text-sm text-white/85">
          {symbol} · pump.fun bonding curve · {interval}
        </div>
        {!hasData ? (
          <div className="absolute inset-0 flex items-center justify-center text-[13px] text-[#8b8b95]">
            no trades yet. once the curve has activity, candles will appear here in real time.
          </div>
        ) : null}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
