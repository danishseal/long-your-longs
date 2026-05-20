import { NextResponse } from "next/server";

type Asset = { name?: string; isDelisted?: boolean };

export const revalidate = 600;

export async function GET() {
  try {
    const response = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "meta" }),
      next: { revalidate: 600 },
    });
    if (!response.ok) {
      return NextResponse.json({ assets: [] }, { status: response.status });
    }
    const data = (await response.json()) as { universe?: Asset[] };
    const assets = (data.universe ?? [])
      .map((a, i) => ({
        index: i,
        symbol: a.name ?? "",
        isDelisted: Boolean(a.isDelisted),
      }))
      .filter((a) => a.symbol.length > 0 && !a.isDelisted)
      .map(({ index, symbol }) => ({ index, symbol }));
    return NextResponse.json({ assets });
  } catch {
    return NextResponse.json({ assets: [] }, { status: 502 });
  }
}
