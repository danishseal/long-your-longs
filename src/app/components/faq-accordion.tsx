"use client";

import { Minus, Plus } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

const faqs: { q: string; a: string }[] = [
  {
    q: "What does it mean that this token is perp-backed?",
    a: "Mode A LYL tokens are paired 1:1 with a leveraged perpetual on Hyperliquid that opens at buy time and shrinks at sell time. Mode B tokens accumulate pump.fun creator fees over time, and the harvester bridges those fees into a perp on Hyperliquid in batches. Either way, the backing is a live, mark-to-market position you can verify on a public exchange instead of a 'vibes' allocation.",
  },
  {
    q: "Mode A vs Mode B, what's the difference?",
    a: "Mode A (perp-backed direct): our SPL on our bonding curve. Every buy mints tokens AND opens a proportional perp on Hyperliquid in ~30 to 60s. Every sell shrinks the perp. Mode B (pump.fun creator fees): the token lives on pump.fun's curve; trades happen there. Our PDA is registered as the creator, so 100% of pump.fun's 5bps creator fees auto-bridge to a perp on Hyperliquid every harvest cycle. Mode A is tighter; Mode B rides pump.fun's distribution.",
  },
  {
    q: "Why is there a 0.15 SOL minimum buy on Mode A?",
    a: "Each Mode A buy triggers a Solana → USDC bridge via deBridge plus a CoreWriter limit order on Hyperliquid. Those have fixed costs (~$2-3) that swamp very small trades. deBridge solvers also quote poorly under ~$10 (we've seen a 56% haircut at 0.2 SOL). 0.15 SOL is the empirical floor where the perp opens cleanly.",
  },
  {
    q: "Why does my sell sometimes fail with 'curve escrow empty'?",
    a: "Your SOL was bridged to Hyperliquid the moment you bought, to open the perp. The curve's wSOL escrow drains in the process. A rebalance daemon refills it every ~2 min by withdrawing USDC from Hyperliquid and swapping back to wSOL on Solana. Sells succeed once that loop refills enough to cover your sell size.",
  },
  {
    q: "Where does the 1% fee go?",
    a: "Entirely to operations. The bridge cranker pays deBridge protocol fees, HyperEVM gas, Solana gas, and Jupiter slippage on every bridge round-trip. There's no creator allocation, no team allocation, no protocol take. On Mode B, pump.fun's 5bps creator fee is what funds the perp instead of the 1%.",
  },
  {
    q: "What happens if the underlying perp gets liquidated?",
    a: "On Mode A, the perp is opened at your chosen leverage (capped at 3x). Liquidation on the Hyperliquid L1 account reduces the curve's USD backing proportionally, which reduces the token's NAV. We cap leverage at 3x to make routine market noise non-liquidating, but extreme moves against you can wipe the position. The Solana curve itself can't be drained; only the dollar value of redeemed SOL changes.",
  },
  {
    q: "Why does my token show 'Unknown Token' in Phantom?",
    a: "Mode A tokens don't write Solana token metadata on-chain (the launch instruction doesn't CPI into the SPL token-metadata program). Wallets that rely on that metadata standard show them as 'Unknown'. Mode B tokens live on pump.fun and have proper metadata, so they display correctly in wallets.",
  },
  {
    q: "What's slippage and how do I set it?",
    a: "Slippage is the difference between the price you expect and the price you actually get. The trade panel's gear icon lets you set a tolerance; the on-chain program enforces it via the min_sol_out / min_tokens_out param and reverts if you'd get less than that.",
  },
  {
    q: "Why does the chart show BTC × 3x instead of my token's price?",
    a: "On Mode A, the token's NAV is mechanically tied to the underlying perp × leverage, rebased to your launch time. We chart that directly because the curve only mints/burns based on SOL flows, so a candle chart of curve price would be flat between trades. On Mode B, the chart is the actual pump.fun bonding curve.",
  },
  {
    q: "Can the curve graduate to Raydium?",
    a: "No, that's the 'perp forever' design. Pump.fun-style curves graduate to Raydium after hitting a SOL threshold, which breaks any backend's ability to keep the perp synced. We never do that. The curve and the perp both run indefinitely.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="divide-y divide-[#065f46]/10">
      {faqs.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={faq.q}>
            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : i)}
              className="flex w-full items-center justify-between py-3 text-left text-sm text-[#6b756d] transition-colors hover:text-[#065f46] md:text-base"
            >
              <span>{faq.q}</span>
              <span className="shrink-0 text-lg leading-none text-[#7a827b]">
                {isOpen ? <Minus size={16} /> : <Plus size={16} />}
              </span>
            </button>
            {isOpen && (
              <div className="pb-3 pr-8 text-xs leading-relaxed text-[#6b756d] md:text-sm">
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
