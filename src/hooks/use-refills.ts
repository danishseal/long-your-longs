"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { fetchRecentRefills } from "@/lib/altsol/refills";

export const REFILLS_QUERY_KEY = (mint: string) =>
  ["altsol", "refills", mint] as const;

export function useRefills(mint: string, opts?: { enabled?: boolean }) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: REFILLS_QUERY_KEY(mint),
    queryFn: () => fetchRecentRefills(connection, mint, 10),
    staleTime: 60_000,
    refetchInterval: 120_000,
    enabled: opts?.enabled !== false && !!mint,
    retry: 1,
  });
}
