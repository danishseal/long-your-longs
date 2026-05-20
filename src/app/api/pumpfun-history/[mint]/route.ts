import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const PUMP_PROGRAM = new PublicKey(
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
);

// Server-side helper that uses the NEXT_PUBLIC_SOLANA_RPC_URL (also available
// server-side) or the public mainnet beta.
function getRpc(): string {
  const v = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  return v && v.length > 0 ? v : "https://api.mainnet-beta.solana.com";
}

function findBondingCurvePda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve"), mint.toBuffer()],
    PUMP_PROGRAM,
  );
  return pda;
}

export interface Trade {
  ts: number; // seconds
  sig: string;
  priceSol: number; // SOL per whole token after the trade
  solAmount: number; // signed: positive = buy, negative = sell (signer pov)
  isBuy: boolean;
}

export const revalidate = 10;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint: mintStr } = await params;
  const limit = Math.min(
    100,
    Math.max(20, Number(req.nextUrl.searchParams.get("limit") ?? 80)),
  );

  let mint: PublicKey;
  try {
    mint = new PublicKey(mintStr);
  } catch {
    return NextResponse.json({ trades: [] }, { status: 400 });
  }
  const bondingCurve = findBondingCurvePda(mint);

  const conn = new Connection(getRpc(), "confirmed");

  const sigs = await conn
    .getSignaturesForAddress(bondingCurve, { limit })
    .catch(() => [] as Awaited<ReturnType<typeof conn.getSignaturesForAddress>>);
  if (sigs.length === 0) {
    return NextResponse.json({ trades: [] });
  }

  // Fetch txs in parallel batches to avoid spiking the RPC.
  const txs = await Promise.all(
    sigs.map((s) =>
      conn
        .getTransaction(s.signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        })
        .catch(() => null),
    ),
  );

  const out: Trade[] = [];
  const bondingStr = bondingCurve.toBase58();
  const mintBs = mint.toBase58();

  for (let i = 0; i < sigs.length; i++) {
    const sig = sigs[i];
    const tx = txs[i];
    if (!tx?.meta) continue;
    const logs = tx.meta.logMessages ?? [];
    // pump.fun's buy/sell tx logs typically include several `Instruction:` lines
    // (GetFees, Buy/Sell, GetFees again). Look at ALL of them and prefer the
    // explicit Buy/Sell entry over the FeeManager ones.
    const ixLogs = logs.filter((l) =>
      l.startsWith("Program log: Instruction:"),
    );
    let isBuy: boolean | null = null;
    for (const l of ixLogs) {
      if (/\bBuy\b/.test(l)) {
        isBuy = true;
        break;
      }
      if (/\bSell\b/.test(l)) {
        isBuy = false;
        break;
      }
    }
    if (isBuy === null) continue;

    // Build the full account key list. Modern v0 txs put many accounts in
    // Address Lookup Tables; balance arrays are indexed against
    // [staticKeys, loadedWritable, loadedReadonly] in that order.
    const staticKeys = tx.transaction.message.staticAccountKeys ?? [];
    const loaded = (tx.meta as any).loadedAddresses ?? {};
    const writable: string[] = (loaded.writable ?? []).map((k: any) => k.toString());
    const readonly: string[] = (loaded.readonly ?? []).map((k: any) => k.toString());
    const fullKeys: string[] = [
      ...staticKeys.map((k) => k.toBase58()),
      ...writable,
      ...readonly,
    ];
    const bcIdx = fullKeys.findIndex((k) => k === bondingStr);
    if (bcIdx < 0) continue;
    const preBc = tx.meta.preBalances?.[bcIdx] ?? 0;
    const postBc = tx.meta.postBalances?.[bcIdx] ?? 0;
    const bcDeltaLamports = postBc - preBc;
    const solAmount = Math.abs(bcDeltaLamports) / 1e9;

    // Token delta: how many tokens moved out of (buy) or into (sell) the
    // bonding curve's token account.
    let tokenDelta = 0;
    const pre = tx.meta.preTokenBalances ?? [];
    const post = tx.meta.postTokenBalances ?? [];
    for (const p of pre) {
      if (p.owner !== bondingStr || p.mint !== mintBs) continue;
      const postEntry = post.find(
        (q) => q.accountIndex === p.accountIndex,
      );
      const preAmt = p.uiTokenAmount?.uiAmount ?? 0;
      const postAmt = postEntry?.uiTokenAmount?.uiAmount ?? 0;
      tokenDelta += (postAmt ?? 0) - (preAmt ?? 0);
    }
    const tokenAmount = Math.abs(tokenDelta);
    if (tokenAmount <= 0 || solAmount <= 0) continue;

    const priceSol = solAmount / tokenAmount;
    out.push({
      ts: sig.blockTime ?? Math.floor(Date.now() / 1000),
      sig: sig.signature,
      priceSol,
      solAmount: isBuy ? solAmount : -solAmount,
      isBuy,
    });
  }

  out.sort((a, b) => a.ts - b.ts);
  return NextResponse.json({ trades: out });
}
