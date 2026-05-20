import { NextResponse } from "next/server";

type PumpCoin = {
  usd_market_cap?: number;
  market_cap_quote?: number;
  total_supply?: number | string;
  total_supply_str?: string;
  base_decimals?: number;
  last_trade_timestamp?: number;
  updated_at?: number;
};

export const revalidate = 3;

function toWholeTokenSupply(coin: PumpCoin): number {
  const rawSupply = Number(coin.total_supply ?? coin.total_supply_str ?? 0);
  const decimals = Number(coin.base_decimals ?? 6);
  if (!Number.isFinite(rawSupply) || rawSupply <= 0) return 0;
  return rawSupply / 10 ** decimals;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;

  try {
    const response = await fetch(
      `https://frontend-api-v3.pump.fun/coins-v2/${encodeURIComponent(mint)}?includeLiveStreamInfo=true`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: 3 },
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "unavailable" },
        { status: response.status },
      );
    }

    const coin = (await response.json()) as PumpCoin;
    const marketCapUsd = Number(
      coin.usd_market_cap ?? coin.market_cap_quote ?? 0,
    );
    const totalSupply = toWholeTokenSupply(coin);
    const priceUsd =
      marketCapUsd > 0 && totalSupply > 0 ? marketCapUsd / totalSupply : 0;
    const lastTradeTimestamp = Number(
      coin.last_trade_timestamp ?? coin.updated_at ?? 0,
    );

    return NextResponse.json({
      priceUsd,
      marketCapUsd,
      lastTradeTimestamp,
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
