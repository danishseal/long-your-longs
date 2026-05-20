"use client";

import { HYPERLIQUID_API_URL } from "./constants";

export interface HyperliquidUniverseEntry {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  onlyIsolated?: boolean;
}

export interface HyperliquidMeta {
  universe: HyperliquidUniverseEntry[];
}

export interface HyperliquidPosition {
  coin: string;
  szi: string;        // signed size, e.g. "-0.5"
  entryPx: string;
  positionValue: string;
  unrealizedPnl: string;
  leverage: { type: string; value: number };
  liquidationPx?: string;
}

export interface ClearinghouseState {
  assetPositions: Array<{ type: string; position: HyperliquidPosition }>;
  marginSummary: { accountValue: string; totalNtlPos: string; totalRawUsd: string };
  withdrawable: string;
}

async function hlPost<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch(HYPERLIQUID_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Hyperliquid API ${res.status}`);
  return (await res.json()) as T;
}

export async function fetchHyperliquidMeta(): Promise<HyperliquidMeta> {
  return hlPost<HyperliquidMeta>({ type: "meta" });
}

export async function fetchClearinghouseState(user: `0x${string}`): Promise<ClearinghouseState | null> {
  try {
    return await hlPost<ClearinghouseState>({ type: "clearinghouseState", user });
  } catch {
    return null;
  }
}

export async function fetchAllMids(): Promise<Record<string, string>> {
  return hlPost<Record<string, string>>({ type: "allMids" });
}

export function hyperliquidPositionExplorerUrl(account: `0x${string}`): string {
  return `https://app.hyperliquid.xyz/explorer/address/${account}`;
}
