"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchHyperliquidMeta } from "@/lib/altsol/hyperliquid";

export function useHyperliquidMaxLeverage(assetIndex: number, fallback = 10) {
  const query = useQuery({
    queryKey: ["hyperliquid-meta"],
    queryFn: fetchHyperliquidMeta,
    staleTime: 10 * 60_000,
  });

  const entry = query.data?.universe[assetIndex];
  return {
    maxLeverage: entry?.maxLeverage ?? fallback,
    szDecimals: entry?.szDecimals ?? 4,
    isLoading: query.isLoading,
  };
}
