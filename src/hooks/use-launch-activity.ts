"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { fetchLaunchActivity, type LaunchActivity } from "@/lib/altsol/fetch";

/// Mode B (pump.fun) activity proxy: hit our pump.fun history endpoint and
/// shape it as LaunchActivity so the same UI panel can render either source.
async function fetchPumpActivityViaApi(
  mintAddress: string,
  limit: number,
): Promise<LaunchActivity[]> {
  try {
    const r = await fetch(
      `/api/pumpfun-history/${mintAddress}?limit=${Math.max(8, limit)}`,
    );
    if (!r.ok) return [];
    const data = (await r.json()) as {
      trades?: Array<{
        ts: number;
        sig: string;
        priceSol: number;
        solAmount: number;
        isBuy: boolean;
      }>;
    };
    return (data.trades ?? [])
      .slice(-limit)
      .reverse()
      .map((t) => ({
        signature: t.sig,
        slot: 0,
        blockTime: t.ts,
        kind: t.isBuy ? ("buy" as const) : ("sell" as const),
        signer: "pump.fun",
        solDelta: t.solAmount,
        tokenDelta: undefined,
        networkFee: undefined,
      }));
  } catch {
    return [];
  }
}

export function useLaunchActivity(
  mintAddress: string,
  opts?: { enabled?: boolean; source?: "perp" | "pump" },
) {
  const { connection } = useConnection();
  const source = opts?.source ?? "perp";
  return useQuery({
    queryKey: ["altsol", "activity", source, mintAddress],
    queryFn: () =>
      source === "pump"
        ? fetchPumpActivityViaApi(mintAddress, 12)
        : fetchLaunchActivity(connection, mintAddress, 8),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: opts?.enabled !== false && !!mintAddress,
    retry: 1,
  });
}
