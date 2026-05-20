"use client";

import { useEffect, useState } from "react";
import { ArrowSquareOut, CheckCircle, Spinner } from "@phosphor-icons/react";
import { HYPEREVM_PERP_MANAGER } from "@/lib/altsol/constants";
import { fetchClearinghouseState } from "@/lib/altsol/hyperliquid";

interface BridgeStatusBannerProps {
  mint: string;
}

interface PendingBridge {
  mint: string;
  side: "buy" | "sell";
  startedAt: number;
  baselineSize: number;
}

const STORAGE_PREFIX = "lyl_bridge_pending:";
const TIMEOUT_MS = 180_000; // 3 minutes

export function setBridgePending(side: "buy" | "sell", mint: string, baselineSize: number) {
  if (typeof window === "undefined") return;
  const entry: PendingBridge = {
    mint,
    side,
    startedAt: Date.now(),
    baselineSize,
  };
  localStorage.setItem(`${STORAGE_PREFIX}${mint}`, JSON.stringify(entry));
}

export function BridgeStatusBanner({ mint }: BridgeStatusBannerProps) {
  const [entry, setEntry] = useState<PendingBridge | null>(null);
  const [confirmedAt, setConfirmedAt] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${mint}`);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as PendingBridge;
      if (Date.now() - parsed.startedAt < TIMEOUT_MS) {
        setEntry(parsed);
      } else {
        localStorage.removeItem(`${STORAGE_PREFIX}${mint}`);
      }
    } catch {
      localStorage.removeItem(`${STORAGE_PREFIX}${mint}`);
    }
  }, [mint]);

  useEffect(() => {
    if (!entry || confirmedAt) return;
    let cancelled = false;

    async function poll() {
      try {
        // V1 single-account model: poll the manager contract's L1 perp account.
        // Any position size change indicates this user's bridge landed.
        const state = await fetchClearinghouseState(HYPEREVM_PERP_MANAGER);
        if (cancelled) return;
        const sz = state?.assetPositions.reduce(
          (acc, p) => acc + Math.abs(parseFloat(p.position.szi)),
          0
        ) ?? 0;
        if (entry && Math.abs(sz - entry.baselineSize) > 1e-9) {
          setConfirmedAt(Date.now());
          localStorage.removeItem(`${STORAGE_PREFIX}${mint}`);
        }
      } catch {}
    }

    const interval = setInterval(poll, 5_000);
    void poll();
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setEntry(null);
        localStorage.removeItem(`${STORAGE_PREFIX}${mint}`);
      }
    }, TIMEOUT_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [entry, confirmedAt, mint]);

  if (!entry) return null;

  const elapsed = Math.floor((Date.now() - entry.startedAt) / 1000);
  const hyperdashHref =
    "https://hyperdash.com/address/0x1ddf514644fc66492d39fcb6a452cdcb2a5bf3d5";

  return (
    <div className="mb-4 rounded-md border border-primary/40 bg-primary/5 px-4 py-3">
      <div className="flex items-center gap-3">
        {confirmedAt ? (
          <CheckCircle size={20} weight="fill" className="shrink-0 text-primary" />
        ) : (
          <Spinner size={20} className="shrink-0 animate-spin text-primary" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {confirmedAt
              ? entry.side === "buy"
                ? "Position opened on Hyperliquid"
                : "Position closed on Hyperliquid"
              : entry.side === "buy"
                ? "Bridging to Hyperliquid..."
                : "Closing position and bridging SOL back..."}
          </p>
          <p className="text-xs text-muted-foreground">
            {confirmedAt
              ? `confirmed in ${Math.floor(((confirmedAt - entry.startedAt) / 1000))}s`
              : `${elapsed}s elapsed · usually 30-60s`}
            <a
              href={hyperdashHref}
              target="_blank"
              rel="noreferrer"
              className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
            >
              view on hyperdash <ArrowSquareOut size={11} />
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
