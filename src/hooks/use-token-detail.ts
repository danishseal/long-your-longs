"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { fetchAltsolLaunchByAddress } from "@/lib/altsol/fetch";

export const TOKEN_DETAIL_QUERY_KEY = (address: string) =>
  ["altsol", "launch", address] as const;

export function useTokenDetail(address: string) {
  const { connection } = useConnection();
  return useQuery({
    queryKey: TOKEN_DETAIL_QUERY_KEY(address),
    queryFn: () => fetchAltsolLaunchByAddress(connection, address),
    staleTime: 15_000,
    refetchInterval: 30_000,
    enabled: !!address,
  });
}
