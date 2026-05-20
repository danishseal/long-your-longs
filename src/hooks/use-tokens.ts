"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { fetchAltsolLaunches } from "@/lib/altsol/fetch";
import type { TokenListItem } from "@/lib/api";

export const TOKENS_QUERY_KEY = ["altsol", "launches"] as const;

type StoredTokenMetadata = {
  name?: string;
  symbol?: string;
  image?: string;
  description?: string;
  creator?: string;
};

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const text = value?.trim();
  return text ? text : null;
}

async function hydrateLaunchMetadata(
  items: TokenListItem[],
): Promise<TokenListItem[]> {
  const hydrated = await Promise.all(
    items.map(async (item) => {
      const needsMetadata =
        item.source === "perp" &&
        (!item.image ||
          !item.name ||
          !item.symbol ||
          !item.description ||
          !item.creator);

      if (!needsMetadata) {
        return item;
      }

      try {
        const response = await fetch(`/api/metadata/${item.address}`);
        if (!response.ok) {
          return item;
        }

        const metadata = (await response.json()) as StoredTokenMetadata;
        return {
          ...item,
          name:
            normalizeOptionalText(item.name) ??
            normalizeOptionalText(metadata.name),
          symbol:
            normalizeOptionalText(item.symbol) ??
            normalizeOptionalText(metadata.symbol),
          image:
            normalizeOptionalText(item.image) ??
            normalizeOptionalText(metadata.image),
          description:
            normalizeOptionalText(item.description) ??
            normalizeOptionalText(metadata.description),
          creator:
            normalizeOptionalText(item.creator) ??
            normalizeOptionalText(metadata.creator),
        };
      } catch {
        return item;
      }
    }),
  );

  return hydrated;
}

export function useTokens() {
  const { connection } = useConnection();
  return useQuery({
    queryKey: TOKENS_QUERY_KEY,
    queryFn: async () => {
      const launches = await fetchAltsolLaunches(connection);
      return hydrateLaunchMetadata(launches);
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
