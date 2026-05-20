"use client";

import { useQuery } from "@tanstack/react-query";

export interface DsPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { address: string; name: string; symbol: string };
  priceNative?: string;
  priceUsd?: string;
  txns?: {
    m5?: { buys: number; sells: number };
    h1?: { buys: number; sells: number };
    h6?: { buys: number; sells: number };
    h24?: { buys: number; sells: number };
  };
  volume?: { m5?: number; h1?: number; h6?: number; h24?: number };
  priceChange?: { m5?: number; h1?: number; h6?: number; h24?: number };
  liquidity?: { usd?: number; base?: number; quote?: number };
  marketCap?: number;
  fdv?: number;
  pairCreatedAt?: number;
  info?: { imageUrl?: string };
}

export const DEXSCREENER_QUERY_KEY = (mint: string) =>
  ["dexscreener", mint] as const;

async function fetchDs(mint: string): Promise<DsPair | null> {
  if (!mint) return null;
  try {
    const r = await fetch(`/api/dexscreener/${mint}`);
    if (!r.ok) return null;
    const data = (await r.json()) as { pair: DsPair | null };
    return data.pair;
  } catch {
    return null;
  }
}

export function useDexscreener(mint: string) {
  return useQuery({
    queryKey: DEXSCREENER_QUERY_KEY(mint),
    queryFn: () => fetchDs(mint),
    staleTime: 20_000,
    refetchInterval: 30_000,
    enabled: !!mint,
  });
}
