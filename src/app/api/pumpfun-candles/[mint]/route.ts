import { NextRequest, NextResponse } from "next/server";

type Candle = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time?: number;
  timestamp?: number;
  t?: number;
};

export const revalidate = 15;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;
  const interval = req.nextUrl.searchParams.get("interval") ?? "1m";
  try {
    const r = await fetch(
      `https://swap-api.pump.fun/v1/coins/${encodeURIComponent(mint)}/candles?interval=${encodeURIComponent(interval)}&limit=500`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 15 },
      },
    );
    if (!r.ok) return NextResponse.json({ candles: [] }, { status: r.status });
    const raw = (await r.json()) as Candle[];
    // Normalize: produce { t, o, h, l, c, v } in seconds.
    const candles = (Array.isArray(raw) ? raw : []).map((c) => {
      const t =
        c.time ?? c.timestamp ?? c.t ?? 0;
      // pump.fun emits ms timestamps; normalize to seconds.
      const tSec = t > 10_000_000_000 ? Math.floor(t / 1000) : Math.floor(t);
      return {
        t: tSec,
        o: Number(c.open),
        h: Number(c.high),
        l: Number(c.low),
        c: Number(c.close),
        v: Number(c.volume ?? 0),
      };
    });
    return NextResponse.json({ candles });
  } catch {
    return NextResponse.json({ candles: [] }, { status: 502 });
  }
}
