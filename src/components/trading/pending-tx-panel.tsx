"use client";

import { ArrowSquareOut, CheckCircle, Spinner } from "@phosphor-icons/react";
import type { LaunchActivity } from "@/lib/altsol/fetch";

type Status = "bridging" | "settling" | "settled";

function classifyTx(ev: LaunchActivity, nowSec: number): Status {
  // No on-chain indexer ties Solana intents to HyperEVM fills, so we estimate
  // by transaction age:
  //   <30s   →  bridging (deBridge solver in flight)
  //   30-90s →  settling (USDC arrived, opening the perp)
  //   >90s   →  settled
  const ts = ev.blockTime ?? nowSec;
  const age = nowSec - ts;
  if (age < 30) return "bridging";
  if (age < 90) return "settling";
  return "settled";
}

function StatusPill({ status }: { status: Status }) {
  if (status === "settled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm bg-[#065f46]/12 px-1.5 py-[2px] text-[10px] font-bold uppercase tracking-wide text-[#065f46]">
        <CheckCircle size={10} weight="fill" />
        settled
      </span>
    );
  }
  const label = status === "bridging" ? "bridging" : "settling perp";
  return (
    <span className="inline-flex items-center gap-1 rounded-sm bg-[#f0b90b]/15 px-1.5 py-[2px] text-[10px] font-bold uppercase tracking-wide text-[#946700]">
      <Spinner size={10} weight="bold" className="animate-spin" />
      {label}
    </span>
  );
}

function kindBadge(kind: LaunchActivity["kind"]) {
  const c =
    kind === "buy"
      ? "bg-[#065f46]/12 text-[#065f46]"
      : kind === "sell"
        ? "bg-[#b42318]/12 text-[#b42318]"
        : "bg-[#6f857c]/15 text-[#3b4a44]";
  return (
    <span className={`rounded-sm px-1.5 py-[1px] text-[10px] font-bold uppercase ${c}`}>
      {kind}
    </span>
  );
}

function relativeTime(blockTime: number | null): string {
  if (!blockTime) return "—";
  const diff = Math.floor(Date.now() / 1000 - blockTime);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function PendingTxPanel({ activity }: { activity: LaunchActivity[] }) {
  const nowSec = Math.floor(Date.now() / 1000);
  const tradeEvents = activity.filter((e) => e.kind === "buy" || e.kind === "sell");
  const pending = tradeEvents.filter((e) => classifyTx(e, nowSec) !== "settled");
  const recent = tradeEvents.slice(0, 6);

  return (
    <div className="border-b border-[#065f46]/10 px-4 py-3 md:px-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-[#7a827b]">
          <span>bridge transparency</span>
          {pending.length > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-sm bg-[#f0b90b]/15 px-1.5 py-[2px] text-[10px] font-bold uppercase text-[#946700]">
              <Spinner size={10} weight="bold" className="animate-spin" />
              {pending.length} pending
            </span>
          ) : null}
        </div>
        <span className="text-[11px] text-[#6f857c]">
          Solana → Hyperliquid bridge takes 30–60s
        </span>
      </div>

      {recent.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#065f46]/15 bg-[#fffaf3] px-3 py-4 text-center text-[12px] text-[#6f857c]">
          no trades yet. every buy mints tokens immediately and opens a proportional perp on Hyperliquid within ~60s.
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[#065f46]/15 bg-[#fffaf3]">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-b border-[#065f46]/10 bg-[#f5f2ed] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#6f857c]">
            <span>signer</span>
            <span className="text-center">side</span>
            <span className="text-right">when</span>
            <span className="text-right">status</span>
          </div>
          {recent.map((ev) => {
            const status = classifyTx(ev, nowSec);
            return (
              <a
                key={ev.signature}
                href={`https://solscan.io/tx/${ev.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-b border-[#065f46]/8 px-3 py-2 text-[12px] transition-colors last:border-0 hover:bg-[#e6ddd0]/40"
              >
                <span className="inline-flex items-center gap-1 font-mono text-[12px] text-[#17372d]">
                  {ev.signer.slice(0, 4)}…{ev.signer.slice(-4)}
                  <ArrowSquareOut size={10} className="text-[#8aa296]" />
                </span>
                <span className="text-center">{kindBadge(ev.kind)}</span>
                <span className="whitespace-nowrap text-right text-[11px] text-[#6f857c]">
                  {relativeTime(ev.blockTime)}
                </span>
                <span className="text-right">
                  <StatusPill status={status} />
                </span>
              </a>
            );
          })}
        </div>
      )}

      <p className="mt-2 text-[11px] leading-relaxed text-[#6f857c]">
        Status is estimated from on-chain block time, not from a hyperliquid indexer. Click any row to see the Solana tx on Solscan. The bridge crank{" "}
        <a
          href="/docs#bridge"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#065f46] underline decoration-dotted underline-offset-2"
        >
          how it works
        </a>
        .
      </p>
    </div>
  );
}
