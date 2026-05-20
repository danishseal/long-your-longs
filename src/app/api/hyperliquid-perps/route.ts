import { NextResponse } from "next/server";

type Asset = { name?: string; isDelisted?: boolean };
type Ctx = { markPx?: string; prevDayPx?: string; dayNtlVlm?: string };

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
      return NextResponse.json({ assets: [] }, { status: response.status });
    }
    const [meta, ctxs] = (await response.json()) as [
      { universe?: Asset[] },
      Ctx[],
    ];
    const assets = (meta.universe ?? [])
      .map((a, i) => {
        const c = ctxs[i];
        const mark = Number(c?.markPx);
        const prev = Number(c?.prevDayPx);
        const ntl = Number(c?.dayNtlVlm);
        if (!a.name || a.isDelisted) return null;
        const change =
          Number.isFinite(mark) && Number.isFinite(prev) && prev > 0
            ? ((mark - prev) / prev) * 100
            : 0;
        return {
          index: i,
          symbol: a.name,
          markPx: Number.isFinite(mark) ? mark : 0,
          change,
          dayNtlVlm: Number.isFinite(ntl) ? ntl : 0,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return NextResponse.json({ assets });
  } catch {
    return NextResponse.json({ assets: [] }, { status: 502 });
  }
}
