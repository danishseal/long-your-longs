"use client";

import { Connection, PublicKey } from "@solana/web3.js";
import { NATIVE_MINT, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { findLaunchAuthorityPda, findLaunchPda } from "./constants";

export interface RefillEvent {
  signature: string;
  blockTime: number | null;
  /** Net wSOL flowing into the launch's quote ATA, in SOL. Positive = refill. */
  deltaSol: number;
  /** Signer (typically the bridge cranker on val3). */
  signer: string;
}

/// Read recent rebalance refills into the launch's wSOL ATA. Each refill is a
/// transaction that increased the ATA's wSOL balance — these are emitted by
/// the rebalance daemon (see altsol-rebalance on val3). Sells that drain the
/// ATA show up as negative deltas and are filtered out.
export async function fetchRecentRefills(
  connection: Connection,
  mintAddress: string,
  limit = 20,
): Promise<RefillEvent[]> {
  let mint: PublicKey;
  try {
    mint = new PublicKey(mintAddress);
  } catch {
    return [];
  }
  const [launchPda] = findLaunchPda(mint);
  const [launchAuthority] = findLaunchAuthorityPda(launchPda);
  const launchQuoteAta = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    launchAuthority,
    true,
  );

  const sigs = await connection
    .getSignaturesForAddress(launchQuoteAta, { limit })
    .catch(() => []);
  if (sigs.length === 0) return [];

  const txs = await Promise.all(
    sigs.map((s) =>
      connection
        .getTransaction(s.signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        })
        .catch(() => null),
    ),
  );

  const out: RefillEvent[] = [];
  const ataStr = launchQuoteAta.toBase58();
  for (let i = 0; i < sigs.length; i++) {
    const sig = sigs[i];
    const tx = txs[i];
    if (!tx?.meta) continue;

    // Find the launchQuoteAta in the account keys to compute its delta from
    // pre/post token balances.
    const pre = tx.meta.preTokenBalances ?? [];
    const post = tx.meta.postTokenBalances ?? [];
    const preEntry = pre.find((b) => {
      const acctIdx = b.accountIndex;
      const key = tx.transaction.message.staticAccountKeys?.[acctIdx];
      return key?.toBase58() === ataStr;
    });
    const postEntry = post.find((b) => {
      const acctIdx = b.accountIndex;
      const key = tx.transaction.message.staticAccountKeys?.[acctIdx];
      return key?.toBase58() === ataStr;
    });
    const preAmt = preEntry?.uiTokenAmount?.uiAmount ?? 0;
    const postAmt = postEntry?.uiTokenAmount?.uiAmount ?? 0;
    const delta = (postAmt ?? 0) - (preAmt ?? 0);
    if (delta <= 0) continue; // skip outflows (sells)

    const signer =
      tx.transaction.message.staticAccountKeys?.[0]?.toBase58() ?? "?";

    out.push({
      signature: sig.signature,
      blockTime: sig.blockTime ?? null,
      deltaSol: delta,
      signer,
    });
  }
  return out;
}
