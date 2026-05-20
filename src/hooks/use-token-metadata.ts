"use client";

import { useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useQuery } from "@tanstack/react-query";
import { findLaunchPda, findPumpLaunchPda } from "@/lib/altsol/constants";
import { useAltsolProgram } from "@/lib/altsol/program";

export interface TokenMeta {
  source: "perp" | "pump" | "unknown";
  mint: string;
  name: string | null;
  symbol: string | null;
  image: string | null;
  description: string | null;
  socials: string[];
  creator: string | null;
  pumpFunUrl: string | null;
}

interface PumpFunCoin {
  mint?: string;
  name?: string;
  symbol?: string;
  description?: string;
  image_uri?: string;
  twitter?: string;
  telegram?: string;
  website?: string;
  creator?: string;
}

interface AltsolMetadata {
  mint?: string;
  name?: string;
  symbol?: string;
  description?: string;
  image?: string;
  socials?: string[];
  creator?: string;
}

function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  const text = value?.trim();
  return text ? text : null;
}

async function fetchPerpMeta(
  mint: string,
  fallbackName: string | null,
  fallbackSymbol: string | null,
  fallbackCreator: string | null,
): Promise<TokenMeta> {
  try {
    const res = await fetch(`/api/metadata/${mint}`);
    if (res.ok) {
      const meta = (await res.json()) as AltsolMetadata;
      return {
        source: "perp",
        mint,
        name: normalizeOptionalText(meta.name) ?? fallbackName,
        symbol: normalizeOptionalText(meta.symbol) ?? fallbackSymbol,
        image: normalizeOptionalText(meta.image),
        description: normalizeOptionalText(meta.description),
        socials: meta.socials ?? [],
        creator: normalizeOptionalText(meta.creator) ?? fallbackCreator,
        pumpFunUrl: null,
      };
    }
  } catch {
    // fall through
  }
  return {
    source: "perp",
    mint,
    name: fallbackName,
    symbol: fallbackSymbol,
    image: null,
    description: null,
    socials: [],
    creator: fallbackCreator,
    pumpFunUrl: null,
  };
}

async function fetchPumpMeta(
  mint: string,
  fallbackCreator: string | null,
): Promise<TokenMeta> {
  try {
    const res = await fetch(`/api/pumpfun/coin/${mint}`);
    if (res.ok) {
      const coin = (await res.json()) as PumpFunCoin;
      const socials = [coin.twitter, coin.telegram, coin.website].filter(
        (s): s is string => !!s,
      );
      return {
        source: "pump",
        mint,
        name: normalizeOptionalText(coin.name),
        symbol: normalizeOptionalText(coin.symbol),
        image: normalizeOptionalText(coin.image_uri),
        description: normalizeOptionalText(coin.description),
        socials,
        creator: normalizeOptionalText(coin.creator) ?? fallbackCreator,
        pumpFunUrl: `https://pump.fun/${mint}`,
      };
    }
  } catch {
    // fall through
  }
  return {
    source: "pump",
    mint,
    name: null,
    symbol: null,
    image: null,
    description: null,
    socials: [],
    creator: fallbackCreator,
    pumpFunUrl: `https://pump.fun/${mint}`,
  };
}

export function useTokenMetadata(mint: string | null) {
  const program = useAltsolProgram();
  const { connection: _connection } = useConnection();

  return useQuery<TokenMeta>({
    queryKey: ["token-meta", mint],
    queryFn: async () => {
      if (!mint || !program) {
        return {
          source: "unknown",
          mint: mint ?? "",
          name: null,
          symbol: null,
          image: null,
          description: null,
          socials: [],
          creator: null,
          pumpFunUrl: null,
        };
      }
      const mintPk = new PublicKey(mint);
      const [launchPda] = findLaunchPda(mintPk);
      const [pumpPda] = findPumpLaunchPda(mintPk);
      const account = program.account as {
        launch: {
          fetchNullable: (pubkey: PublicKey) => Promise<{
            name?: string | null;
            symbol?: string | null;
            creator?: { toBase58?: () => string } | null;
          } | null>;
        };
        pumpLaunch: {
          fetchNullable: (pubkey: PublicKey) => Promise<{
            creator?: { toBase58?: () => string } | null;
          } | null>;
        };
      };

      const [perp, pump] = await Promise.all([
        account.launch.fetchNullable(launchPda).catch(() => null),
        account.pumpLaunch.fetchNullable(pumpPda).catch(() => null),
      ]);

      if (perp) {
        return fetchPerpMeta(
          mint,
          perp.name ?? null,
          perp.symbol ?? null,
          perp.creator?.toBase58?.() ?? null,
        );
      }
      if (pump) {
        return fetchPumpMeta(mint, pump.creator?.toBase58?.() ?? null);
      }
      return {
        source: "unknown",
        mint,
        name: null,
        symbol: null,
        image: null,
        description: null,
        socials: [],
        creator: null,
        pumpFunUrl: null,
      };
    },
    enabled: !!mint && !!program,
    staleTime: 60_000,
  });
}
