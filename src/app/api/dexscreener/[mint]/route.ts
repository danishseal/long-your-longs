import { NextRequest, NextResponse } from "next/server";

export const revalidate = 20;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;
  try {
    const r = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${encodeURIComponent(mint)}`,
      { next: { revalidate: 20 } },
    );
    if (!r.ok) return NextResponse.json({ pair: null }, { status: r.status });
    const data = (await r.json()) as { pairs?: unknown[] };
    const pair = Array.isArray(data.pairs) && data.pairs.length > 0
      ? data.pairs[0]
      : null;
    return NextResponse.json({ pair });
  } catch {
    return NextResponse.json({ pair: null }, { status: 502 });
  }
}
