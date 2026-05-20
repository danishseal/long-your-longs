import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const PUMP_PROGRAM = new PublicKey(
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
);

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

// Decode the pump.fun BondingCurve account directly. Layout:
//   8 disc · u64 vTokenReserves · u64 vSolReserves · u64 realTokenReserves
//   · u64 realSolReserves · u64 tokenTotalSupply · bool complete
function decodeCurve(data: Buffer) {
  if (data.length < 49) return null;
  let off = 8;
  const u64 = () => {
    const v = data.readBigUInt64LE(off);
    off += 8;
    return v;
  };
  return {
    virtualTokenReserves: u64(),
    virtualSolReserves: u64(),
    realTokenReserves: u64(),
    realSolReserves: u64(),
    tokenTotalSupply: u64(),
    complete: data[off] === 1,
  };
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint: mintStr } = await params;
  let mint: PublicKey;
  try {
    mint = new PublicKey(mintStr);
  } catch {
    return NextResponse.json({ error: "bad mint" }, { status: 400 });
  }
  const conn = new Connection(getRpc(), "confirmed");
  const bondingCurve = findBondingCurvePda(mint);
  const bondingStr = bondingCurve.toBase58();

  // Pull recent trades for 1h/6h/24h windows (256 sigs covers most active
  // launches' last 24h; quiet launches get a shorter timespan but we still
  // return what we have).
  const [curveInfo, sigs] = await Promise.all([
    conn.getAccountInfo(bondingCurve).catch(() => null),
    conn
      .getSignaturesForAddress(bondingCurve, { limit: 64 })
      .catch(
        () => [] as Awaited<ReturnType<typeof conn.getSignaturesForAddress>>,
      ),
  ]);

  const curve = curveInfo?.data ? decodeCurve(Buffer.from(curveInfo.data)) : null;

  // Fetch transactions (capped to recent activity for cost).
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

  // Parse trades: priceSol-per-token derived from bonding curve balance delta.
  type Trade = { ts: number; priceSol: number; solVol: number };
  const trades: Trade[] = [];
  const mintBs = mint.toBase58();

  for (let i = 0; i < sigs.length; i++) {
    const sig = sigs[i];
    const tx = txs[i];
    if (!tx?.meta) continue;
    const logs = tx.meta.logMessages ?? [];
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

    const staticKeys = tx.transaction.message.staticAccountKeys ?? [];
    const loaded = (tx.meta as any).loadedAddresses ?? {};
    const writable: string[] = (loaded.writable ?? []).map((k: any) =>
      k.toString(),
    );
    const readonly: string[] = (loaded.readonly ?? []).map((k: any) =>
      k.toString(),
    );
    const fullKeys: string[] = [
      ...staticKeys.map((k) => k.toBase58()),
      ...writable,
      ...readonly,
    ];
    const bcIdx = fullKeys.findIndex((k) => k === bondingStr);
    if (bcIdx < 0) continue;
    const preBc = tx.meta.preBalances?.[bcIdx] ?? 0;
    const postBc = tx.meta.postBalances?.[bcIdx] ?? 0;
    const solDelta = (postBc - preBc) / 1e9;
    const solVol = Math.abs(solDelta);

    // Bonding-curve-side token delta — these accounts have owner = bonding PDA.
    let tokenDelta = 0;
    for (const p of tx.meta.preTokenBalances ?? []) {
      if (p.owner !== bondingStr || p.mint !== mintBs) continue;
      const post = (tx.meta.postTokenBalances ?? []).find(
        (q) => q.accountIndex === p.accountIndex,
      );
      const preAmt = p.uiTokenAmount?.uiAmount ?? 0;
      const postAmt = post?.uiTokenAmount?.uiAmount ?? 0;
      tokenDelta += (postAmt ?? 0) - (preAmt ?? 0);
    }
    const tokenVol = Math.abs(tokenDelta);
    if (tokenVol <= 0 || solVol <= 0) continue;

    trades.push({
      ts: sig.blockTime ?? Math.floor(Date.now() / 1000),
      priceSol: solVol / tokenVol,
      solVol,
    });
  }

  trades.sort((a, b) => a.ts - b.ts);
  const now = Math.floor(Date.now() / 1000);
  const latest = trades[trades.length - 1];
  // priceSol per WHOLE token. virtualSol is in lamports (1e9 per SOL) and
  // virtualTokens is in pump.fun's 6-decimal base units (1e6 per whole token).
  // ratio = lamports / baseUnits = lamports per baseUnit; ×(1e6 / 1e9) = ×1e-3
  // gives SOL per whole token.
  const priceSolNow = curve && Number(curve.virtualTokenReserves) > 0
    ? (Number(curve.virtualSolReserves) / Number(curve.virtualTokenReserves)) * 1e-3
    : latest?.priceSol ?? 0;

  function pctChangeOver(windowSec: number): number {
    const cutoff = now - windowSec;
    // Last trade at or before the window's start = baseline.
    let baseline = trades[0]?.priceSol;
    for (const t of trades) {
      if (t.ts <= cutoff) baseline = t.priceSol;
      else break;
    }
    if (!baseline || baseline <= 0 || !priceSolNow) return 0;
    return (priceSolNow / baseline - 1) * 100;
  }

  function volumeOver(windowSec: number): number {
    const cutoff = now - windowSec;
    return trades.filter((t) => t.ts >= cutoff).reduce((s, t) => s + t.solVol, 0);
  }

  return NextResponse.json({
    priceSol: priceSolNow,
    realSolReserves: curve ? Number(curve.realSolReserves) / 1e9 : 0,
    complete: curve?.complete ?? false,
    change1h: pctChangeOver(3600),
    change6h: pctChangeOver(6 * 3600),
    change24h: pctChangeOver(24 * 3600),
    volSol1h: volumeOver(3600),
    volSol6h: volumeOver(6 * 3600),
    volSol24h: volumeOver(24 * 3600),
    trades24h: trades.filter((t) => t.ts >= now - 24 * 3600).length,
  });
}
