export type TokenActivity = {
  wallet: string;
  fullAddress: string;
  txId: string;
  timestamp: string;
  amount: string;
  side: "Bought" | "Sold";
};

export type TokenAuditItem = {
  label: string;
  value: string;
  status: "good" | "neutral";
};

export type Token = {
  slug: string;
  name: string;
  symbol: string;
  age: string;
  fdv: string;
  mc: string;
  change: string;
  /** Raw curve metrics so the renderer can format in USD when SOL/USD is known. */
  priceSol?: number;
  mcSol?: number;
  liquiditySol?: number;
  /** Position data so cards can render LONG/SHORT × leverage × underlying perp. */
  perpAsset?: number;
  leverageBps?: number;
  positionDirection?: "long" | "short";
  art: string;
  image?: string | null;
  badge?: string;
  creator: string;
  contract: string;
  description: string;
  price: string;
  marketCap: string;
  liquidity: string;
  change1h: string;
  change6h: string;
  change24h: string;
  bondingProgress: number;
  bondingRaised: string;
  bondingTarget: string;
  creatorRewards: string;
  warnings?: number;
  activity: TokenActivity[];
  audit: TokenAuditItem[];
};

export type TickerItem = {
  symbol: string;
  change: string;
};

function createToken(
  token: Partial<Token> & Pick<Token, "slug" | "name" | "symbol" | "art">,
): Token {
  return {
    age: "4d ago",
    fdv: "$4.10K",
    mc: "$4.10K",
    change: "0.00%",
    creator: "Long Your Longs",
    contract: `${token.symbol.toUpperCase()}...LYL`,
    description: `${token.name} is mock placeholder data for the demo token page.`,
    price: "$0.00000245",
    marketCap: token.mc ?? "$4.10K",
    liquidity: "$2.32K",
    change1h: "0.00%",
    change6h: "0.00%",
    change24h: token.change ?? "0.00%",
    bondingProgress: 98.76,
    bondingRaised: "82.38 SOL",
    bondingTarget: "$10,478 to graduate",
    creatorRewards: "13.8534 SOL",
    activity: [
      {
        wallet: "6Z3k...tCrM",
        fullAddress: "6Z3koi9ERWZpcJcEUTb6PuVFju6J7GcghWcosQumtCrM",
        txId: "5upXgs89m1Tk9vCzXGFE29pihbr7tL9tCcNG17jB35VPaQwRuDTWTFroNkf94F5o1FiCgK9KBPVcwK7oMsjyFhXf",
        timestamp: "19/5/2026, 10:34:03 am",
        amount: "+0.378416 SOL",
        side: "Bought",
      },
      {
        wallet: "4Km4...8HYP",
        fullAddress: "4Km4899mguaRvR71y8uXBUqCm9R7uWsG7djQ7TNJ8HYP",
        txId: "3ZhmK5QMdtpSRmpbSsCFwDw8aGaqEQCnuC5Vo1doi3bQW5PdwBXWHhaSFKWAQ6j89g3wvJ2Hh4YRpuNavKHHphh5",
        timestamp: "19/5/2026, 10:31:46 am",
        amount: "+0.378416 SOL",
        side: "Bought",
      },
      {
        wallet: "6DLK...vpbj",
        fullAddress: "6DLKBdfn6riNEtmAffQjMsE8N6a4Mgiuee274kK2vpbj",
        txId: "5BiDjzd5gbVGRYjJhS19PdaFdmijiYa6qPMifd2eBJK1bnAKESU1AAAGmePpy75fqLnTGMwpV5iw4ZyG5fmdSpUf",
        timestamp: "19/5/2026, 10:31:04 am",
        amount: "+0.378416 SOL",
        side: "Bought",
      },
      {
        wallet: "Hext...agYM",
        fullAddress: "HextpSXGYGfaXDkMLCJwiZt977Kf6SuotSAtWkg7agYM",
        txId: "3Sq49dSuU2fciHauWPTcmH2mdGgdLrNtABFJHJtrBBv3DmBstwMDgvMyq967dJZ5Shfa4r2qhUKf1NmtpByPQjKS",
        timestamp: "19/5/2026, 10:30:02 am",
        amount: "+0.378416 SOL",
        side: "Bought",
      },
      {
        wallet: "4bWN...ZbCW",
        fullAddress: "4bWNkjZeucD55r7NxQLALRAQvqUTGAWAwPDhgJfkZbCW",
        txId: "4Hez1y1aXT2gvRBLjuBxssgk6kXjy6oMFvggPAoNGp1hjPVvRbSQ9vQqDj9YKbfmTTcBZ29dizpyB7RtQRw2xCGp",
        timestamp: "19/5/2026, 10:29:12 am",
        amount: "+0.378416 SOL",
        side: "Bought",
      },
      {
        wallet: "2HZY...tzfA",
        fullAddress: "2HZYRgoHwTZr9ntifry5NVtMQ6429zJzR6iMzctZtzfA",
        txId: "UTyVi6qah826VQUpTqjHu3J8Qt4zTK1vD3WEum9KFgToK4bmpjAKuJiSseRirsYwpsPCSdQYHV718huUtwSBrTZ",
        timestamp: "19/5/2026, 10:28:16 am",
        amount: "+0.378416 SOL",
        side: "Bought",
      },
      {
        wallet: "5ZCy...Khis",
        fullAddress: "5ZCyxHHcqk7EB7RwNixjTuXvRq7TqdkUrzmxpD8KKhis",
        txId: "2wY1dk9QpuYVJJAj5jTTGwNA9uDPheDsQ6sQYM391N1KKCvboF4vrjxQ1mfvTTcuAbj7Ejmnk18EvG49zzRnbDsg",
        timestamp: "19/5/2026, 10:26:16 am",
        amount: "+0.378416 SOL",
        side: "Bought",
      },
      {
        wallet: "5EgN...Ncb4",
        fullAddress: "5EgNqmtipUNHPk4GQWTfXfPfxP1LKvZUdBQd5E1hNcb4",
        txId: "3rQdWnvzXYGLYPMyj8Wt2eG41EBtigMDcyjpaBAThkwV9t9G1cjy1rxEt5HvXAwzRitrVA2qyKHxLDLv4dGnhuHh",
        timestamp: "19/5/2026, 10:24:41 am",
        amount: "+0.378416 SOL",
        side: "Bought",
      },
      {
        wallet: "4uc7...UqLD",
        fullAddress: "4uc7dSdhYTawDA9aCSdHi4ycxqGqJj2cuLQXU6hAUqLD",
        txId: "2a1vJm2mFwmck5qWHDd2bJNBnRCpgG8vemgtoJ6eBz1ZQ3yCJQZJg3KWmENzDWmtABUmbnHneyUEccj3JniuD59d",
        timestamp: "19/5/2026, 10:22:15 am",
        amount: "+0.378416 SOL",
        side: "Bought",
      },
      {
        wallet: "B5zh...AA6G",
        fullAddress: "B5zh5ev94HmaBpC32RpVPPdnJC2cohuXLZEL21VAAA6G",
        txId: "3NnriS1B5wYusoKHGnc3yJNGRY4FtrNa4vGzwHa14zLgKm114XELaYF5SCYprTLv6FnVGk7omacB7QnPHvZkGDmK",
        timestamp: "19/5/2026, 10:21:32 am",
        amount: "+0.378416 SOL",
        side: "Bought",
      },
    ],
    audit: [
      { label: "Mint authority disabled", value: "Yes", status: "good" },
      { label: "Freeze authority disabled", value: "Yes", status: "good" },
      { label: "Top 10 holders", value: "6.72%", status: "neutral" },
    ],
    ...token,
  };
}

export const trendingTokens: Token[] = [
  createToken({
    slug: "render-token",
    name: "Render Token",
    symbol: "RENDER",
    age: "1y ago",
    fdv: "$872.60M",
    mc: "$872.60M",
    change: "+3.33%",
    art: "render",
    creator: "Render Network",
    description:
      "Render Token is a trending mock asset used to demo the Long Your Longs token detail layout.",
  }),
  createToken({
    slug: "pudgy-penguins",
    name: "Pudgy Penguins",
    symbol: "PENGU",
    age: "1y ago",
    fdv: "$667.42M",
    mc: "$667.42M",
    change: "+3.98%",
    art: "penguin",
    creator: "Pudgy Team",
  }),
  createToken({
    slug: "jupiter",
    name: "Jupiter",
    symbol: "JUP",
    age: "1y ago",
    fdv: "$1.37B",
    mc: "$662.36M",
    change: "+2.49%",
    art: "jupiter",
    creator: "Jupiter Exchange",
  }),
  createToken({
    slug: "raydium",
    name: "Raydium",
    symbol: "RAY",
    age: "1y ago",
    fdv: "$392.61M",
    mc: "$190.27M",
    change: "+2.09%",
    art: "raydium",
    creator: "Raydium Labs",
  }),
  createToken({
    slug: "troll",
    name: "TROLL",
    symbol: "TROLL",
    age: "1y ago",
    fdv: "$115.57M",
    mc: "$115.57M",
    change: "+8.11%",
    art: "troll",
    creator: "Troll Collective",
  }),
];

export const tokenGrid: Token[] = [
  createToken({
    slug: "bags-of-chips",
    name: "Bags of Chips",
    symbol: "CHIPS",
    age: "3d ago",
    fdv: "$24.69K",
    mc: "$24.69K",
    change: "+11.55%",
    art: "chips",
    creator: "Snack Labs",
  }),
  createToken({
    slug: "pumpy",
    name: "pumpy",
    symbol: "PUMPY",
    age: "4d ago",
    fdv: "$4.03K",
    mc: "$4.03K",
    change: "0.00%",
    art: "robot",
    badge: "Agent",
    creator: "pumpy",
  }),
  createToken({
    slug: "the-roaring-kitty",
    name: "The Roaring Kitty",
    symbol: "TRK",
    age: "5d ago",
    fdv: "$4.23K",
    mc: "$4.23K",
    change: "0.00%",
    art: "kitty",
    badge: "Agent",
    creator: "Roaring Kitty",
  }),
  createToken({
    slug: "buy-for-airdrop",
    name: "Buy For Airdrop",
    symbol: "AIRDROP",
    age: "7d ago",
    fdv: "$4.42K",
    mc: "$4.42K",
    change: "0.00%",
    art: "airdrop",
    creator: "Airdrop Labs",
  }),
  createToken({
    slug: "mutaplex",
    name: "mutaplex",
    symbol: "MUTAPLEX",
    age: "8d ago",
    fdv: "$4.26K",
    mc: "$4.26K",
    change: "0.00%",
    art: "mark",
    creator: "mutaplex",
  }),
  createToken({
    slug: "nak4",
    name: "nak4",
    symbol: "NAK4",
    age: "9d ago",
    fdv: "$4.56K",
    mc: "$4.56K",
    change: "0.00%",
    art: "nak4",
    badge: "Agent",
    creator: "nak4",
  }),
  createToken({
    slug: "degrind",
    name: "DeGrind",
    symbol: "DEGRIND",
    age: "10d ago",
    fdv: "$4.42K",
    mc: "$4.42K",
    change: "0.00%",
    art: "mono",
    badge: "Agent",
    creator: "DeGrind",
  }),
  createToken({
    slug: "chucke82-molt",
    name: "chucke82.molt",
    symbol: "CHUCKE82",
    age: "10d ago",
    fdv: "$4.26K",
    mc: "$4.26K",
    change: "0.00%",
    art: "molt",
    badge: "Agent",
    creator: "chucke82.molt",
  }),
  createToken({
    slug: "mpountain",
    name: "mpountain",
    symbol: "MOUNTAIN",
    age: "11d ago",
    fdv: "$4.10K",
    mc: "$4.10K",
    change: "0.00%",
    art: "mountain",
    badge: "Agent",
    creator: "mpountain",
  }),
  createToken({
    slug: "mjja",
    name: "MJJA",
    symbol: "MJJA",
    age: "12d ago",
    fdv: "$4.11K",
    mc: "$4.11K",
    change: "0.00%",
    art: "block",
    creator: "MJJA",
  }),
  createToken({
    slug: "cyber-horus-ai",
    name: "Cyber Horus AI",
    symbol: "CYH",
    age: "12d ago",
    fdv: "$4.12K",
    mc: "$4.12K",
    change: "0.00%",
    art: "placeholder",
    badge: "Agent",
    creator: "Cyber Horus",
  }),
  createToken({
    slug: "antigravity",
    name: "Antigravity",
    symbol: "ANTI",
    age: "12d ago",
    fdv: "$3.92K",
    mc: "$3.92K",
    change: "+0.43%",
    art: "placeholder",
    badge: "Agent",
    creator: "Antigravity",
  }),
];

export const allTokens = [...trendingTokens, ...tokenGrid];

export function getTokenBySlug(slug: string) {
  return allTokens.find((token) => token.slug === slug);
}

import type { TokenListItem } from "@/lib/api";

function ageFromIso(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function shortAddr(addr: string | null): string {
  if (!addr) return "—";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

/// Adapter: TokenListItem (on-chain payload) → Token (UI shape).
// Constant-product curve constants. Mode A uses 9 token decimals; Mode B
// (pump.fun) uses 6. The TokenListItem carries source-specific overrides.
const VIRTUAL_SOL_INITIAL_LAMPORTS = 30 * 1e9; // 30 SOL — same on both curves

function formatSol(sol: number): string {
  if (!Number.isFinite(sol) || sol === 0) return "0 SOL";
  if (sol >= 1) return `${sol.toFixed(3)} SOL`;
  if (sol >= 0.001) return `${sol.toFixed(4)} SOL`;
  return `${sol.toExponential(2)} SOL`;
}

function formatSolCompact(sol: number): string {
  if (!Number.isFinite(sol) || sol === 0) return "0";
  if (sol >= 1000) return `${(sol / 1000).toFixed(1)}K`;
  if (sol >= 1) return sol.toFixed(2);
  if (sol >= 0.001) return sol.toFixed(4);
  return sol.toExponential(2);
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

export function tokenFromOnChain(item: TokenListItem): Token {
  // Decimals + initial virtual reserves depend on the curve:
  //   Mode A (our SPL):    9 decimals, virtual_tokens = 1.073B × 1e9
  //   Mode B (pump.fun):   6 decimals, virtual_tokens = 1.073B × 1e6
  // Both default to Mode A constants if not supplied.
  const decimals = item.decimals ?? 9;
  const dec = Math.pow(10, decimals);
  const virtualTokensInitial = item.virtual_tokens_initial
    ? Number(item.virtual_tokens_initial)
    : 1_073_000_000 * dec;
  const totalSupplyBase = item.total_supply
    ? Number(item.total_supply)
    : 1_000_000_000 * dec;

  // bonding "progress" for the perp-forever model = how much of the curve's
  // mintable pool has been minted (0–100%). Pool is ~80% of total supply.
  let bondingProgress = 0;
  let bondingRaised = "0 SOL";
  if (item.total_minted) {
    const minted = Number(item.total_minted);
    const mintable = 0.8 * totalSupplyBase;
    if (mintable > 0) bondingProgress = Math.min(100, (minted / mintable) * 100);
  }
  const hasRealSolReserves = item.real_sol_reserves != null;
  const realSolLamports = hasRealSolReserves ? Number(item.real_sol_reserves) : 0;
  if (realSolLamports) {
    bondingRaised = `${(realSolLamports / 1e9).toFixed(3)} SOL`;
  }

  // Constant-product curve price = (virtual_sol + real_sol) / virtual_tokens.
  // priceSolPerToken is in SOL per WHOLE token (apply decimal scaling).
  const minted = item.total_minted ? Number(item.total_minted) : 0;
  const virtualSolLamports = VIRTUAL_SOL_INITIAL_LAMPORTS + realSolLamports;
  const virtualTokensBase = virtualTokensInitial - minted;
  const priceSolPerToken =
    virtualTokensBase > 0
      ? (virtualSolLamports / virtualTokensBase) * (dec / 1e9)
      : 0;
  const mcSol = priceSolPerToken * (totalSupplyBase / dec);
  const liquiditySol = hasRealSolReserves ? realSolLamports / 1e9 : undefined;

  const lev = item.leverage_bps ? `${(item.leverage_bps / 10_000).toFixed(0)}x` : "1x";
  const dir = item.direction ?? "long";
  const description = item.description
    ?? `perp-backed: ${dir} ${lev} on Hyperliquid perp #${item.perp_asset ?? 0}`;
  return {
    slug: item.address,
    name: item.name ?? "Untitled",
    symbol: item.symbol ?? "—",
    age: ageFromIso(item.first_seen_at ?? item.created_at),
    fdv: mcSol > 0 ? `◎${formatSolCompact(mcSol)}` : "—",
    mc: mcSol > 0 ? `◎${formatSolCompact(mcSol)}` : "—",
    change: "0.00%",
    priceSol: priceSolPerToken > 0 ? priceSolPerToken : undefined,
    mcSol: mcSol > 0 ? mcSol : undefined,
    liquiditySol,
    perpAsset: item.perp_asset,
    leverageBps: item.leverage_bps,
    positionDirection: item.direction,
    art: (item.symbol ?? item.address ?? "default").slice(0, 8),
    image: normalizeOptionalText(item.image),
    badge: item.source === "pump" ? "pump" : item.graduated ? "live" : `${dir} ${lev}`,
    creator: shortAddr(item.creator),
    contract: shortAddr(item.address),
    description,
    price: priceSolPerToken > 0 ? `${priceSolPerToken.toExponential(3)} SOL` : "—",
    marketCap: mcSol > 0 ? formatSol(mcSol) : "—",
    liquidity: liquiditySol !== undefined ? formatSol(liquiditySol) : "—",
    change1h: "0.00%",
    change6h: "0.00%",
    change24h: "0.00%",
    bondingProgress,
    bondingRaised,
    bondingTarget: "perp-forever",
    creatorRewards: "0 SOL",
    activity: [],
    audit: [
      { label: "Mint authority", value: "PDA", status: "good" },
      { label: "Freeze authority", value: "PDA", status: "good" },
      { label: "Curve fee", value: item.fee_bps ? `${(item.fee_bps / 100).toFixed(1)}%` : "0%", status: "neutral" },
    ],
  };
}
