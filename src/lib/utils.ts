import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const NATIVE_SYMBOL = "SOL";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Legacy micro-unit helpers kept for any remaining callers; treat as 6 decimals.
const MICRO_DECIMALS = 6;
const MICRO_MULTIPLIER = 10 ** MICRO_DECIMALS;

export function toMicro(amount: string): string {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) return "0";
  return Math.floor(num * MICRO_MULTIPLIER).toString();
}

export function fromMicro(amount: string): number {
  const num = Number(amount);
  if (isNaN(num)) return 0;
  return num / MICRO_MULTIPLIER;
}

export function formatNativeAmount(microAmount: string): string {
  const num = fromMicro(microAmount);
  if (num === 0) return `0 ${NATIVE_SYMBOL}`;
  if (num < 0.001) return `${num.toExponential(2)} ${NATIVE_SYMBOL}`;
  if (num < 1) return `${num.toFixed(6)} ${NATIVE_SYMBOL}`;
  if (num < 1000) return `${num.toFixed(2)} ${NATIVE_SYMBOL}`;
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)}K ${NATIVE_SYMBOL}`;
  return `${(num / 1_000_000).toFixed(2)}M ${NATIVE_SYMBOL}`;
}

export function formatTokenAmount(amount: string): string {
  const num = Number(amount) / MICRO_MULTIPLIER;
  if (num === 0) return "0";
  if (num < 0.01) return num.toExponential(2);
  if (num < 1000) return num.toFixed(2);
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatUsd(usdAmount: number): string {
  if (usdAmount === 0) return "$0.00";
  if (usdAmount < 0.0001) return `$${usdAmount.toExponential(2)}`;
  if (usdAmount < 0.01) return `$${usdAmount.toFixed(6)}`;
  if (usdAmount < 1) return `$${usdAmount.toFixed(4)}`;
  if (usdAmount < 1000) return `$${usdAmount.toFixed(2)}`;
  if (usdAmount < 1_000_000) return `$${(usdAmount / 1000).toFixed(1)}K`;
  if (usdAmount < 1_000_000_000) return `$${(usdAmount / 1_000_000).toFixed(2)}M`;
  return `$${(usdAmount / 1_000_000_000).toFixed(2)}B`;
}

export function computeMinOutput(
  simulatedOutput: string,
  slippagePercent: number
): string {
  const output = BigInt(simulatedOutput);
  const slippageBps = Math.round(slippagePercent * 100);
  const minOutput = (output * BigInt(10000 - slippageBps)) / BigInt(10000);
  return minOutput.toString();
}
