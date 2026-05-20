"use client";

import { useQuery } from "@tanstack/react-query";

export const SOL_PRICE_QUERY_KEY = ["sol-price"] as const;

type HlPerp = { symbol: string; markPx: number };

async function fetchSolPrice(): Promise<number> {
  // Use Hyperliquid (already proxied) — Coingecko hits 429 from this app.
  try {
    const res = await fetch("/api/hyperliquid-perps");
    if (!res.ok) return 0;
    const data = (await res.json()) as { assets?: HlPerp[] };
    const sol = data.assets?.find((a) => a.symbol === "SOL");
    return Number(sol?.markPx ?? 0);
  } catch {
    return 0;
  }
}

export function useSolPrice() {
  const query = useQuery({
    queryKey: [...SOL_PRICE_QUERY_KEY],
    queryFn: fetchSolPrice,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  return {
    ...query,
    solPriceUsd: query.data ?? 0,
  };
}
