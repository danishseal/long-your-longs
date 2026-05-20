"use client";

import { useQuery } from "@tanstack/react-query";

export interface PumpStats {
  priceSol: number;
  realSolReserves: number;
  complete: boolean;
  change1h: number;
  change6h: number;
  change24h: number;
  volSol1h: number;
  volSol6h: number;
  volSol24h: number;
  trades24h: number;
}

async function fetchPumpStats(mint: string): Promise<PumpStats | null> {
  if (!mint) return null;
  const r = await fetch(`/api/pumpfun-stats/${mint}`);
  if (!r.ok) return null;
  return (await r.json()) as PumpStats;
}

export function usePumpStats(mint: string, opts?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["pumpfun-stats", mint],
    queryFn: () => fetchPumpStats(mint),
    enabled: opts?.enabled !== false && !!mint,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
