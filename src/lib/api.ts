export interface TokenListItem {
  address: string;
  name: string | null;
  symbol: string | null;
  image: string | null;
  description: string | null;
  creator: string | null;
  source: string;
  graduated: boolean;
  created_at: string | null;
  first_seen_at: string | null;
  created_height?: number | null;
  current_price: string;
  reserves: string;
  volume_24h: string;
  trade_count_24h: number;
  // V6 curve fields (when source = "perp")
  total_minted?: string;
  total_supply?: string;
  real_sol_reserves?: string;
  fee_bps?: number;
  perp_asset?: number;
  leverage_bps?: number;
  direction?: "long" | "short";
  /** Token decimals. Mode A = 9, Mode B (pump.fun) = 6. */
  decimals?: number;
  /** Initial virtual_tokens on the curve, in base units (decimals-aware). */
  virtual_tokens_initial?: string;
}
