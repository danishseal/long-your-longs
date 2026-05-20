"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BN } from "@coral-xyz/anchor";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
} from "@solana/spl-token";
import { Gear } from "@phosphor-icons/react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { TOKENS_QUERY_KEY } from "@/hooks/use-tokens";
import { TOKEN_DETAIL_QUERY_KEY, useTokenDetail } from "@/hooks/use-token-detail";
import { useAltsolProgram } from "@/lib/altsol/program";
import { useSolPrice } from "@/hooks/use-sol-price";
import { BRIDGE_CRANKER_PUBKEY, findLaunchAuthorityPda, findLaunchPda, HYPEREVM_PERP_MANAGER } from "@/lib/altsol/constants";
import { fetchClearinghouseState } from "@/lib/altsol/hyperliquid";
import { setBridgePending } from "./bridge-status-banner";
import { useWalletConnect } from "@/app/components/wallet-connect-modal";

type Side = "buy" | "sell";

interface TradePanelProps {
  tokenAddress: string;
  tokenSymbol: string;
}

const BUY_PRESETS_USD = [30, 100, 500, 1000];
const SELL_PRESETS_PCT = [25, 50, 75, 100];

// Minimum buy size in SOL. Below this, deBridge's bundled Jupiter pre-swap
// (wSOL → USDC) routes through thin DEXes that flake on slippage / stale pool
// state. 0.15 SOL is the empirical threshold for reliable Raydium/Orca routing.
const MIN_BUY_SOL = 0.15;

export function TradePanel({ tokenAddress, tokenSymbol }: TradePanelProps) {
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const queryClient = useQueryClient();
  const program = useAltsolProgram();
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const { open: openWalletModal } = useWalletConnect();
  const { solPriceUsd } = useSolPrice();
  const { data: launchItem } = useTokenDetail(tokenAddress);

  // Read the launch's actual wSOL ATA balance — this is what sells can
  // actually be paid out of, and it may differ from the on-chain
  // real_sol_reserves counter (rebalance-daemon refills aren't synced to it).
  const { data: actualWsolBalance = 0 } = useQuery({
    queryKey: ["launch-wsol", tokenAddress],
    queryFn: async () => {
      if (!program) return 0;
      try {
        const mint = new PublicKey(tokenAddress);
        const [launchPda] = findLaunchPda(mint);
        const quoteAta = getAssociatedTokenAddressSync(NATIVE_MINT, launchPda, true);
        const acc = await connection.getTokenAccountBalance(quoteAta).catch(() => null);
        return Number(acc?.value?.uiAmount ?? 0);
      } catch {
        return 0;
      }
    },
    enabled: !!program && !!tokenAddress,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  // Sellable = min(counter, actual). When they diverge we trust the lower
  // number because that's what the burn-then-transfer will succeed on.
  const counterSol = launchItem?.real_sol_reserves
    ? Number(launchItem.real_sol_reserves) / 1e9
    : 0;
  const sellableSol = Math.min(counterSol, actualWsolBalance);

  // SOL balance
  const { data: solBalance = 0 } = useQuery({
    queryKey: ["sol-balance", publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return 0;
      const lamports = await connection.getBalance(publicKey);
      return lamports / 1e9;
    },
    enabled: !!publicKey,
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  // Synth share balance (TEST tokens)
  const { data: shareBalance = 0 } = useQuery({
    queryKey: ["share-balance", tokenAddress, publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return 0;
      const mint = new PublicKey(tokenAddress);
      const ata = getAssociatedTokenAddressSync(mint, publicKey);
      try {
        const info = await connection.getTokenAccountBalance(ata);
        return Number(info.value.uiAmount ?? 0);
      } catch {
        return 0;
      }
    },
    enabled: !!publicKey && side === "sell",
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  const buyMutation = useMutation({
    mutationFn: async (solAmount: number) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");

      const mint = new PublicKey(tokenAddress);
      const [launch] = findLaunchPda(mint);
      const [launchAuthority] = findLaunchAuthorityPda(launch);

      // Read live curve state to compute expected tokens (for min_tokens_out slippage check).
      const launchAccount = (await (program.account as any).launch.fetch(launch)) as {
        virtualSolReserves: any;
        virtualTokenReserves: any;
      };
      const vSol = BigInt(launchAccount.virtualSolReserves.toString());
      const vTok = BigInt(launchAccount.virtualTokenReserves.toString());
      const solInLamports = BigInt(Math.floor(solAmount * 1_000_000_000));
      const k = vSol * vTok;
      const newVSol = vSol + solInLamports;
      const newVTok = k / newVSol;
      const expectedOut = vTok - newVTok;
      const slippageBps = BigInt(Math.max(1, Math.floor(slippage * 100)));
      const minTokensOut = (expectedOut * (BigInt(10000) - slippageBps)) / BigInt(10000);

      const userSynthAta = getAssociatedTokenAddressSync(mint, publicKey);
      const launchQuoteAta = getAssociatedTokenAddressSync(NATIVE_MINT, launchAuthority, true);
      const crankerWsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, BRIDGE_CRANKER_PUBKEY);

      return program.methods
        .buy({
          solIn: new BN(solInLamports.toString()),
          minTokensOut: new BN(minTokensOut.toString()),
        } as never)
        .accounts({
          user: publicKey,
          launch,
          launchAuthority,
          mint,
          quoteMint: NATIVE_MINT,
          userSynthAta,
          launchQuoteAta,
          crankerWsolAta,
          cranker: BRIDGE_CRANKER_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as never)
        .rpc({ commitment: "confirmed" });
    },
    onMutate: () => toast.loading("Submitting buy...", { id: "trade-tx" }),
    onSuccess: async (sig) => {
      toast.success("Buy submitted. Bridging to Hyperliquid (~30-60s)...", {
        id: "trade-tx",
        description: `${sig.slice(0, 12)}...`,
        action: {
          label: "view tx",
          onClick: () => window.open(`https://solscan.io/tx/${sig}`, "_blank", "noopener"),
        },
        duration: 10_000,
      });
      try {
        const state = await fetchClearinghouseState(HYPEREVM_PERP_MANAGER);
        const baseline = state?.assetPositions.reduce(
          (acc, p) => acc + Math.abs(parseFloat(p.position.szi)),
          0,
        ) ?? 0;
        setBridgePending("buy", tokenAddress, baseline);
      } catch {}
      setAmount("");
      queryClient.invalidateQueries({ queryKey: TOKENS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOKEN_DETAIL_QUERY_KEY(tokenAddress) });
    },
    onError: (e) => {
      toast.error("Buy failed", { id: "trade-tx", description: e instanceof Error ? e.message : "Unknown" });
    },
  });

  const sellMutation = useMutation({
    mutationFn: async (shareAmount: number) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");

      const mint = new PublicKey(tokenAddress);
      const [launch] = findLaunchPda(mint);
      const [launchAuthority] = findLaunchAuthorityPda(launch);
      const userSynthAta = getAssociatedTokenAddressSync(mint, publicKey);
      const userQuoteAta = getAssociatedTokenAddressSync(NATIVE_MINT, publicKey);
      const launchQuoteAta = getAssociatedTokenAddressSync(NATIVE_MINT, launchAuthority, true);
      const crankerWsolAta = getAssociatedTokenAddressSync(NATIVE_MINT, BRIDGE_CRANKER_PUBKEY);

      // Read curve state to compute expected SOL out, apply slippage.
      const launchAccount = (await (program.account as any).launch.fetch(launch)) as {
        virtualSolReserves: any;
        virtualTokenReserves: any;
      };
      const vSol = BigInt(launchAccount.virtualSolReserves.toString());
      const vTok = BigInt(launchAccount.virtualTokenReserves.toString());
      const sharesInLamports = BigInt(Math.floor(shareAmount * 1_000_000_000));
      const k = vSol * vTok;
      const newVTok = vTok + sharesInLamports;
      const newVSol = k / newVTok;
      const expectedSolOut = vSol - newVSol;
      const slippageBps = BigInt(Math.max(1, Math.floor(slippage * 100)));
      const minSolOut = (expectedSolOut * (BigInt(10000) - slippageBps)) / BigInt(10000);

      return program.methods
        .sell({
          sharesIn: new BN(sharesInLamports.toString()),
          minSolOut: new BN(minSolOut.toString()),
        } as never)
        .accounts({
          user: publicKey,
          launch,
          launchAuthority,
          mint,
          quoteMint: NATIVE_MINT,
          userSynthAta,
          userQuoteAta,
          launchQuoteAta,
          crankerWsolAta,
          cranker: BRIDGE_CRANKER_PUBKEY,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as never)
        .rpc({ commitment: "confirmed" });
    },
    onMutate: () => toast.loading("Submitting sell...", { id: "trade-tx" }),
    onSuccess: async (sig) => {
      toast.success("Sell submitted. Closing on Hyperliquid (~30-60s)...", {
        id: "trade-tx",
        description: `${sig.slice(0, 12)}...`,
        action: {
          label: "view tx",
          onClick: () => window.open(`https://solscan.io/tx/${sig}`, "_blank", "noopener"),
        },
        duration: 10_000,
      });
      try {
        const state = await fetchClearinghouseState(HYPEREVM_PERP_MANAGER);
        const baseline = state?.assetPositions.reduce(
          (acc, p) => acc + Math.abs(parseFloat(p.position.szi)),
          0,
        ) ?? 0;
        setBridgePending("sell", tokenAddress, baseline);
      } catch {}
      setAmount("");
      queryClient.invalidateQueries({ queryKey: TOKENS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: TOKEN_DETAIL_QUERY_KEY(tokenAddress) });
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : "Unknown";
      // Two error classes both mean "curve doesn't have enough wSOL right now":
      //   - AltsolError::MathOverflow (6005): the program's pre-check
      //     `sol_out <= real_sol_reserves` failed.
      //   - SPL Token 0x1 InsufficientFunds: real_sol_reserves said we had
      //     enough but the actual wSOL ATA was empty (rebalance not synced).
      // Both surface as the same user-facing message.
      const isMath = /MathOverflow|math overflow|6005/i.test(msg);
      const isTokenInsufficient =
        /custom program error:\s*0x0?1\b/i.test(msg) ||
        /Tokenkeg[^,]*failed: custom program error:\s*0x0?1/i.test(msg) ||
        /insufficient funds/i.test(msg);
      if (isMath || isTokenInsufficient) {
        toast.error("Curve escrow too small for this sell", {
          id: "trade-tx",
          description:
            `Sellable right now: ${sellableSol.toFixed(4)} SOL (~$${(sellableSol * solPriceUsd).toFixed(2)}). Your SOL was bridged to Hyperliquid to open the perp; the rebalance daemon refills every ~2 min. Try a smaller amount, or wait and retry.`,
          duration: 14_000,
        });
      } else {
        toast.error("Sell failed", { id: "trade-tx", description: msg });
      }
    },
  });

  const isPending = buyMutation.isPending || sellMutation.isPending;

  function handleSubmit() {
    if (!connected) {
      openWalletModal();
      return;
    }
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;

    if (side === "buy") {
      if (solPriceUsd <= 0) {
        toast.error("Sol price unavailable, try again");
        return;
      }
      const solAmount = n / solPriceUsd;
      if (solAmount < MIN_BUY_SOL) {
        const minUsd = MIN_BUY_SOL * solPriceUsd;
        toast.error(`Minimum buy is ${MIN_BUY_SOL} SOL (~$${minUsd.toFixed(0)})`);
        return;
      }
      buyMutation.mutate(solAmount);
    } else {
      sellMutation.mutate(n);
    }
  }

  function applyPreset(value: number) {
    if (side === "buy") {
      setAmount(String(value));
    } else {
      // percent of share balance
      const portion = (shareBalance * value) / 100;
      setAmount(portion.toFixed(6));
    }
  }

  const usdDisplay = side === "buy" && amount
    ? `$${Number(amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    : "$0";

  const availableLabel = side === "buy"
    ? `${solBalance.toFixed(4)} SOL ($${(solBalance * solPriceUsd).toFixed(2)}) available`
    : `${shareBalance.toFixed(4)} ${tokenSymbol} available`;

  const cta = !connected
    ? "Connect wallet"
    : isPending
      ? "Submitting..."
      : side === "buy"
        ? `Buy ${tokenSymbol}`
        : `Sell ${tokenSymbol}`;

  return (
    <div className="space-y-3 rounded-xl border border-[#065f46]/15 bg-[#fffaf3] p-3">
      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-[#e6ddd0]/60 p-1">
        <button
          type="button"
          onClick={() => { setSide("buy"); setAmount(""); }}
          className={cn(
            "h-9 rounded-md text-sm font-bold transition-colors",
            side === "buy"
              ? "bg-[#065f46] text-white shadow-sm"
              : "text-[#647067] hover:text-[#17372d]",
          )}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => { setSide("sell"); setAmount(""); }}
          className={cn(
            "h-9 rounded-md text-sm font-bold transition-colors",
            side === "sell"
              ? "bg-[#b42318] text-white shadow-sm"
              : "text-[#647067] hover:text-[#17372d]",
          )}
        >
          Sell
        </button>
      </div>

      {/* Amount input */}
      <div className="rounded-lg border border-[#065f46]/15 bg-[#f5f2ed] px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-1">
            {side === "buy" ? (
              <span className="text-2xl font-semibold text-[#647067]">$</span>
            ) : null}
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              disabled={isPending}
              className="w-full bg-transparent text-3xl font-semibold text-[#17372d] outline-none placeholder:text-[#647067]/50"
            />
          </div>
          <span className="shrink-0 text-xs uppercase tracking-wider text-[#647067]">
            {side === "buy" ? "Enter amount" : tokenSymbol}
          </span>
        </div>
      </div>

      {/* Presets + settings */}
      <div className="flex items-center gap-1.5">
        {(side === "buy" ? BUY_PRESETS_USD : SELL_PRESETS_PCT).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => applyPreset(v)}
            disabled={isPending || (side === "sell" && shareBalance === 0)}
            className="flex-1 rounded-md bg-[#e6ddd0]/60 px-2 py-2 text-xs font-bold text-[#17372d] transition-colors hover:bg-[#e6ddd0] disabled:opacity-50"
          >
            {side === "buy" ? `$${v}` : `${v}%`}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="rounded-md bg-[#e6ddd0]/60 p-2 transition-colors hover:bg-[#e6ddd0]"
          aria-label="settings"
        >
          <Gear size={14} className="text-[#17372d]" />
        </button>
      </div>

      {settingsOpen ? (
        <div className="rounded-md border border-[#065f46]/15 bg-[#f5f2ed] p-3 text-xs">
          <label className="flex items-center justify-between text-[#647067]">
            <span>Slippage tolerance</span>
            <span className="font-mono text-[#17372d]">{slippage}%</span>
          </label>
          <input
            type="range"
            min={0.1}
            max={5}
            step={0.1}
            value={slippage}
            onChange={(e) => setSlippage(Number(e.target.value))}
            className="mt-2 w-full accent-[#065f46]"
          />
        </div>
      ) : null}

      <p className="text-xs text-[#647067]">{availableLabel}</p>

      {/* CTA */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className={cn(
          "h-12 w-full rounded-lg text-sm font-bold transition-colors",
          !connected
            ? "bg-[#17372d] text-white hover:bg-[#0e2419]"
            : side === "buy"
              ? "bg-[#065f46] text-white hover:bg-[#054c38]"
              : "bg-[#b42318] text-white hover:bg-[#8a1c12]",
          isPending && "opacity-60",
        )}
      >
        {cta}
      </button>

      {/* Footer note */}
      {side === "buy" && solPriceUsd > 0 ? (
        <p className="text-[11px] leading-relaxed text-[#647067]">
          Min buy {MIN_BUY_SOL} SOL (~${(MIN_BUY_SOL * solPriceUsd).toFixed(0)}). 1% fee on every trade.{" "}
          <a
            href="/docs#fees"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#065f46] underline decoration-dotted underline-offset-2 hover:decoration-solid"
          >
            why?
          </a>
        </p>
      ) : null}

      {side === "sell" && sellableSol >= 0 ? (
        <p className="text-[11px] leading-relaxed text-[#647067]">
          Sellable curve liquidity: <span className="font-bold tabular-nums text-[#17372d]">{sellableSol.toFixed(4)} SOL</span>
          {solPriceUsd > 0 ? ` (~$${(sellableSol * solPriceUsd).toFixed(2)})` : ""}.
          {sellableSol < 0.001 ? " Wait for the rebalance daemon to refill (~2 min)." : null}{" "}
          <a
            href="/docs#bridge"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#065f46] underline decoration-dotted underline-offset-2 hover:decoration-solid"
          >
            why?
          </a>
        </p>
      ) : null}
    </div>
  );
}
