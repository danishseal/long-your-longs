"use client";

import { ArrowSquareOut, ArrowDown, Drop } from "@phosphor-icons/react";
import type { RefillEvent } from "@/lib/altsol/refills";

function relativeTime(blockTime: number | null): string {
  if (!blockTime) return "—";
  const diff = Math.floor(Date.now() / 1000 - blockTime);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function RefillLogPanel({
  refills,
  solPriceUsd,
}: {
  refills: RefillEvent[];
  solPriceUsd: number;
}) {
  const lastRefill = refills[0];
  const totalSol = refills.reduce((s, r) => s + r.deltaSol, 0);
  const totalUsd = totalSol * solPriceUsd;
  return (
    <div className="border-b border-[#065f46]/10 px-4 py-3 md:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-[#7a827b]">
          <Drop size={14} className="text-[#065f46]" />
          <span>bridge refills</span>
          {lastRefill ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-[#065f46]/12 px-1.5 py-[2px] text-[10px] font-bold uppercase text-[#065f46]">
              last {relativeTime(lastRefill.blockTime)}
            </span>
          ) : null}
        </div>
        {totalSol > 0 ? (
          <span className="text-[11px] text-[#6f857c]">
            total refilled into curve:{" "}
            <span className="font-bold tabular-nums text-[#17372d]">
              {totalSol.toFixed(4)} SOL
            </span>
            {solPriceUsd > 0 ? (
              <span className="font-bold tabular-nums text-[#17372d]">
                {" "}(${totalUsd.toFixed(2)})
              </span>
            ) : null}
          </span>
        ) : (
          <span className="text-[11px] text-[#6f857c]">
            rebalance daemon → curve wSOL ATA
          </span>
        )}
      </div>

      {refills.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#065f46]/15 bg-[#fffaf3] px-3 py-4 text-center text-[12px] text-[#6f857c]">
          no refills yet. The rebalance daemon pulls USDC back from Hyperliquid
          and swaps to wSOL once buys have accumulated enough margin.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[#065f46]/15 bg-[#fffaf3]">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-[#065f46]/10 bg-[#f5f2ed] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#6f857c]">
            <span>from</span>
            <span className="text-right">amount</span>
            <span className="text-right">USD</span>
            <span className="text-right">when</span>
          </div>
          {refills.map((r) => (
            <a
              key={r.signature}
              href={`https://solscan.io/tx/${r.signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-[#065f46]/8 px-3 py-2 text-[12px] transition-colors last:border-0 hover:bg-[#e6ddd0]/40"
            >
              <span className="inline-flex items-center gap-1 font-mono text-[12px] text-[#17372d]">
                {r.signer.slice(0, 4)}…{r.signer.slice(-4)}
                <ArrowSquareOut size={10} className="text-[#8aa296]" />
              </span>
              <span className="inline-flex items-center justify-end gap-1 whitespace-nowrap text-right font-bold tabular-nums text-[#065f46]">
                <ArrowDown size={9} weight="bold" />
                {r.deltaSol.toFixed(4)} SOL
              </span>
              <span className="whitespace-nowrap text-right text-[11px] tabular-nums text-[#6f857c]">
                {solPriceUsd > 0 ? `$${(r.deltaSol * solPriceUsd).toFixed(2)}` : "—"}
              </span>
              <span className="whitespace-nowrap text-right text-[11px] text-[#6f857c]">
                {relativeTime(r.blockTime)}
              </span>
            </a>
          ))}
        </div>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-[#6f857c]">
        Sells refund from the curve&apos;s wSOL escrow. When buys bridge SOL to
        Hyperliquid, the escrow drains; the rebalance daemon refills it from
        the L1 perp account every ~2 min. Each row above is an on-chain
        wSOL transfer into the curve&apos;s ATA — click for the Solana tx.
      </p>
    </div>
  );
}
