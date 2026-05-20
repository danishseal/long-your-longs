import { NextResponse } from "next/server";
import type { TickerItem } from "../../lib/token-data";

type HyperliquidUniverseAsset = {
  name?: string;
  isDelisted?: boolean;
};

type HyperliquidAssetContext = {
  dayNtlVlm?: string;
  markPx?: string;
  prevDayPx?: string;
};

export const revalidate = 30;

export async function GET() {
  try {
    const response = await fetch("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return NextResponse.json({ items: [] }, { status: response.status });
    }

    const [meta, assetContexts] = (await response.json()) as [
      { universe?: HyperliquidUniverseAsset[] },
      HyperliquidAssetContext[],
    ];

    const items: TickerItem[] = (meta.universe ?? [])
      .map((asset, index) => {
        const context = assetContexts[index];
        const markPx = Number(context?.markPx);
        const prevDayPx = Number(context?.prevDayPx);
        const dayNtlVlm = Number(context?.dayNtlVlm);

        if (
          !asset.name ||
          asset.isDelisted ||
          !Number.isFinite(markPx) ||
          !Number.isFinite(prevDayPx) ||
          prevDayPx === 0
        ) {
          return null;
        }

        const change = ((markPx - prevDayPx) / prevDayPx) * 100;

        return {
          symbol: asset.name,
          change: `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`,
          dayNtlVlm: Number.isFinite(dayNtlVlm) ? dayNtlVlm : 0,
        };
      })
      .filter((item): item is TickerItem & { dayNtlVlm: number } =>
        Boolean(item),
      )
      .sort((a, b) => b.dayNtlVlm - a.dayNtlVlm)
      .map(({ symbol, change }) => ({ symbol, change }));

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] }, { status: 502 });
  }
}
