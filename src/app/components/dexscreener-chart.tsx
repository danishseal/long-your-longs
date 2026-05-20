"use client";

import { ArrowSquareOut } from "@phosphor-icons/react";
import { useDexscreener } from "@/hooks/use-dexscreener";

export default function DexscreenerChart({
  mint,
  symbol,
}: {
  mint: string;
  symbol: string;
}) {
  const { data: pair, isLoading } = useDexscreener(mint);

  const embedUrl = pair?.pairAddress
    ? `https://dexscreener.com/solana/${pair.pairAddress}?embed=1&theme=dark&info=0&trades=0&chartTheme=dark&chartStyle=2`
    : null;

  return (
    <div className="relative w-full overflow-hidden border-y border-white/8 bg-[#0f0f11]">
      <div className="flex items-center gap-4 border-b border-white/8 px-4 py-3 text-sm text-[#b7b7bf]">
        <span>pump.fun · {symbol}</span>
        {pair?.url ? (
          <a
            href={pair.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#20d6b0] hover:underline"
          >
            view on DexScreener
            <ArrowSquareOut size={11} />
          </a>
        ) : null}
        <a
          href={`https://pump.fun/coin/${mint}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#20d6b0] hover:underline"
        >
          pump.fun
          <ArrowSquareOut size={11} />
        </a>
        <span className="ml-auto tabular-nums text-[#b7b7bf]">
          {pair?.priceUsd ? `$${Number(pair.priceUsd).toFixed(8)}` : "—"}
        </span>
      </div>
      {embedUrl ? (
        <iframe
          src={embedUrl}
          title={`${symbol} chart`}
          className="h-[420px] w-full border-0"
          allow="clipboard-write"
        />
      ) : (
        <div className="flex h-[420px] w-full items-center justify-center text-[13px] text-[#8b8b95]">
          {isLoading
            ? "loading chart…"
            : "no DexScreener pair yet — chart appears once the curve has any activity."}
        </div>
      )}
    </div>
  );
}
