import { PublicKey } from "@solana/web3.js";

export const ALTSOL_PROGRAM_ID = new PublicKey(
  "C1q8mGfr8a5rfPbaCJ1mGpocsDJc1xXZxbX1adLAX4r9"
);

export const USDC_MAINNET = new PublicKey(
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
);

export const USDC_DEVNET = new PublicKey(
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

export const PUMPFUN_PROGRAM_ID = new PublicKey(
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P"
);

// Treat empty strings as missing. Vercel's `vercel env pull` can write empty
// strings for unset variables which would otherwise satisfy `??` and break
// downstream consumers (e.g. Connection rejects an empty endpoint URL).
const envOr = (v: string | undefined, fallback: string): string =>
  v && v.length > 0 ? v : fallback;

const rawCluster = process.env.NEXT_PUBLIC_SOLANA_CLUSTER;
export const SOLANA_CLUSTER: "mainnet-beta" | "devnet" =
  rawCluster === "mainnet-beta" || rawCluster === "devnet"
    ? rawCluster
    : "mainnet-beta";

export const SOLANA_RPC_URL = envOr(
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL,
  SOLANA_CLUSTER === "mainnet-beta"
    ? "https://api.mainnet-beta.solana.com"
    : "https://api.devnet.solana.com"
);

export const USDC_MINT_FOR_CLUSTER =
  SOLANA_CLUSTER === "mainnet-beta" ? USDC_MAINNET : USDC_DEVNET;

export const HYPERLIQUID_API_URL = "https://api.hyperliquid.xyz/info";

/// AltsolPerpManager on HyperEVM. Set after deploy.
export const HYPEREVM_PERP_MANAGER = envOr(
  process.env.NEXT_PUBLIC_HYPEREVM_PERP_MANAGER,
  "0x1ddf514644fc66492d39fcb6a452cdcb2a5bf3d5"
) as `0x${string}`;

/// Bridge cranker pubkey — hardcoded in the altsol program as `BRIDGE_CRANKER`.
/// Curve fees (fee_bps × sol_in on buy, fee_bps × sol_out on sell) accrue to
/// this wallet's wSOL ATA. Must be passed in as an account on every buy/sell.
export const BRIDGE_CRANKER_PUBKEY = new PublicKey(
  "5BYyHQHe8CMcAMJogQpz2c9wukSSAZdhrsdnvSFwTVVx"
);

export type HyperliquidPerpMarket = {
  index: number;
  symbol: string;
  baseSymbol: string;
};

/// Static fallback seed of Hyperliquid perp asset indices. The real universe is
/// fetched dynamically at runtime via `useHyperliquidUniverse()`; this list is only
/// used until that returns. Order MUST match Hyperliquid's actual universe (asset
/// index = position in the meta API's `universe` array).
export const HYPERLIQUID_PERP_MARKETS_SEED: HyperliquidPerpMarket[] = [
  { index: 0, symbol: "BTC-PERP", baseSymbol: "BTC" },
  { index: 1, symbol: "ETH-PERP", baseSymbol: "ETH" },
  { index: 2, symbol: "ATOM-PERP", baseSymbol: "ATOM" },
  { index: 3, symbol: "MATIC-PERP", baseSymbol: "MATIC" },
  { index: 4, symbol: "DYDX-PERP", baseSymbol: "DYDX" },
  { index: 5, symbol: "SOL-PERP", baseSymbol: "SOL" },
  { index: 6, symbol: "AVAX-PERP", baseSymbol: "AVAX" },
  { index: 7, symbol: "BNB-PERP", baseSymbol: "BNB" },
  { index: 8, symbol: "APE-PERP", baseSymbol: "APE" },
  { index: 9, symbol: "OP-PERP", baseSymbol: "OP" },
  { index: 10, symbol: "LTC-PERP", baseSymbol: "LTC" },
  { index: 11, symbol: "ARB-PERP", baseSymbol: "ARB" },
  { index: 12, symbol: "DOGE-PERP", baseSymbol: "DOGE" },
  { index: 13, symbol: "INJ-PERP", baseSymbol: "INJ" },
  { index: 14, symbol: "SUI-PERP", baseSymbol: "SUI" },
  { index: 15, symbol: "kPEPE-PERP", baseSymbol: "kPEPE" },
  { index: 16, symbol: "CRV-PERP", baseSymbol: "CRV" },
  { index: 17, symbol: "LDO-PERP", baseSymbol: "LDO" },
  { index: 18, symbol: "LINK-PERP", baseSymbol: "LINK" },
  { index: 19, symbol: "STX-PERP", baseSymbol: "STX" },
  { index: 20, symbol: "RNDR-PERP", baseSymbol: "RNDR" },
  { index: 21, symbol: "CFX-PERP", baseSymbol: "CFX" },
  { index: 22, symbol: "FTM-PERP", baseSymbol: "FTM" },
  { index: 23, symbol: "GMX-PERP", baseSymbol: "GMX" },
  { index: 24, symbol: "SNX-PERP", baseSymbol: "SNX" },
  { index: 25, symbol: "XRP-PERP", baseSymbol: "XRP" },
  { index: 26, symbol: "BCH-PERP", baseSymbol: "BCH" },
  { index: 27, symbol: "APT-PERP", baseSymbol: "APT" },
  { index: 28, symbol: "AAVE-PERP", baseSymbol: "AAVE" },
  { index: 29, symbol: "COMP-PERP", baseSymbol: "COMP" },
];

export function findLaunchPda(mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("launch"), mint.toBuffer()],
    ALTSOL_PROGRAM_ID
  );
}

export function findLaunchAuthorityPda(launch: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("auth"), launch.toBuffer()],
    ALTSOL_PROGRAM_ID
  );
}

export function findPumpLaunchPda(pumpMint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pump_launch"), pumpMint.toBuffer()],
    ALTSOL_PROGRAM_ID
  );
}

export function findPumpAuthorityPda(pumpLaunch: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("pump_auth"), pumpLaunch.toBuffer()],
    ALTSOL_PROGRAM_ID
  );
}
