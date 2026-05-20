"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchHyperliquidMeta } from "@/lib/altsol/hyperliquid";
import {
  HYPERLIQUID_PERP_MARKETS_SEED,
  HyperliquidPerpMarket,
} from "@/lib/altsol/constants";

/// Returns the LIVE Hyperliquid universe. Falls back to the static seed until the
/// info API responds. The asset index in the returned array IS the index used by
/// the Solana program and by CoreWriter for L1 actions.
export function useHyperliquidUniverse(): {
  markets: HyperliquidPerpMarket[];
  isLoading: boolean;
} {
  const query = useQuery({
    queryKey: ["hyperliquid-universe"],
    queryFn: fetchHyperliquidMeta,
    staleTime: 10 * 60_000,
  });

  if (!query.data) {
    return { markets: HYPERLIQUID_PERP_MARKETS_SEED, isLoading: query.isLoading };
  }

  const markets: HyperliquidPerpMarket[] = query.data.universe.map((u, index) => ({
    index,
    symbol: `${u.name}-PERP`,
    baseSymbol: u.name,
  }));
  return { markets, isLoading: false };
}
