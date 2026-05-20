"use client";

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { type Connection, Keypair, PublicKey } from "@solana/web3.js";
import type { TokenListItem } from "@/lib/api";
import idl from "./altsol-idl.json";
import type { Altsol } from "./altsol-types";
import { PUMPFUN_PROGRAM_ID } from "./constants";

// SPL Token Metadata program (the standard Solana program for mint metadata).
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

function findTokenMetadataPda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  );
  return pda;
}

// Decode the on-chain token metadata account. Only the fields we need:
// name, symbol, uri (everything else is skipped).
function decodeTokenMetadata(
  data: Buffer,
): { name: string; symbol: string; uri: string } | null {
  if (data.length < 1 + 32 + 32 + 4) return null;
  // key(1) + updateAuthority(32) + mint(32) = 65 bytes prefix
  let off = 1 + 32 + 32;
  const readBorshString = (maxLen: number): string => {
    if (off + 4 > data.length) return "";
    const len = data.readUInt32LE(off);
    off += 4;
    const take = Math.min(len, maxLen, data.length - off);
    const s = data
      .slice(off, off + len)
      .toString("utf-8")
      .replace(/\0+$/g, "")
      .trim();
    off += len;
    return s.slice(0, take);
  };
  try {
    const name = readBorshString(64);
    const symbol = readBorshString(16);
    const uri = readBorshString(256);
    return { name, symbol, uri };
  } catch {
    return null;
  }
}

interface ResolvedMetadata {
  name?: string;
  symbol?: string;
  uri?: string;
  image?: string;
}

function isDirectImageUri(uri: string): boolean {
  return (
    /^data:image\//i.test(uri) ||
    /\.(png|jpe?g|gif|webp|svg)(?:[?#].*)?$/i.test(uri)
  );
}

async function resolveMetadataImage(uri: string): Promise<string | undefined> {
  const normalizedUri = uri.trim();
  if (!normalizedUri) return undefined;

  if (normalizedUri.startsWith("/") || isDirectImageUri(normalizedUri)) {
    return normalizedUri;
  }

  if (!/^https?:\/\//i.test(normalizedUri)) return undefined;

  try {
    const res = await fetch(normalizedUri);
    if (!res.ok) return undefined;
    const json = (await res.json()) as { image?: unknown };
    const image = typeof json.image === "string" ? json.image.trim() : "";
    return image || undefined;
  } catch {
    return undefined;
  }
}

async function fetchTokenMetadataBatch(
  connection: Connection,
  mints: PublicKey[],
): Promise<Map<string, ResolvedMetadata>> {
  if (mints.length === 0) return new Map();
  const pdas = mints.map(findTokenMetadataPda);
  const out = new Map<string, ResolvedMetadata>();
  try {
    const infos = await connection.getMultipleAccountsInfo(pdas);
    const resolveImagePromises: Array<Promise<void>> = [];
    for (let i = 0; i < mints.length; i++) {
      const info = infos[i];
      if (!info?.data) continue;
      const decoded = decodeTokenMetadata(Buffer.from(info.data));
      if (!decoded) continue;
      const entry: ResolvedMetadata = {
        name: decoded.name || undefined,
        symbol: decoded.symbol || undefined,
        uri: decoded.uri || undefined,
      };
      out.set(mints[i].toBase58(), entry);
      if (decoded.uri) {
        resolveImagePromises.push(
          resolveMetadataImage(decoded.uri).then((image) => {
            if (image) entry.image = image;
          }),
        );
      }
    }
    await Promise.all(resolveImagePromises);
  } catch {}
  return out;
}

// pump.fun BondingCurve layout (well-known):
//   8 bytes Anchor discriminator
//   u64 virtualTokenReserves   (6-decimal base units)
//   u64 virtualSolReserves     (lamports)
//   u64 realTokenReserves      (6-decimal base units)
//   u64 realSolReserves        (lamports)
//   u64 tokenTotalSupply
//   bool complete
// Token decimals on pump are 6 (not 9 like our Mode A).
const PUMP_VIRTUAL_TOKENS_INITIAL = 1_073_000_000 * 1e6;

export interface PumpCurveState {
  virtualTokenReserves: bigint;
  virtualSolReserves: bigint;
  realTokenReserves: bigint;
  realSolReserves: bigint;
  tokenTotalSupply: bigint;
  complete: boolean;
}

function findPumpBondingCurvePda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("bonding-curve"), mint.toBuffer()],
    PUMPFUN_PROGRAM_ID,
  );
  return pda;
}

function decodePumpCurve(data: Buffer): PumpCurveState | null {
  if (data.length < 8 + 5 * 8 + 1) return null;
  let off = 8;
  const readU64 = () => {
    const v = data.readBigUInt64LE(off);
    off += 8;
    return v;
  };
  return {
    virtualTokenReserves: readU64(),
    virtualSolReserves: readU64(),
    realTokenReserves: readU64(),
    realSolReserves: readU64(),
    tokenTotalSupply: readU64(),
    complete: data[off] === 1,
  };
}

export async function fetchPumpBondingCurves(
  connection: Connection,
  mints: PublicKey[],
): Promise<Map<string, PumpCurveState>> {
  if (mints.length === 0) return new Map();
  const pdas = mints.map(findPumpBondingCurvePda);
  const out = new Map<string, PumpCurveState>();
  try {
    const infos = await connection.getMultipleAccountsInfo(pdas);
    for (let i = 0; i < mints.length; i++) {
      const info = infos[i];
      if (!info?.data) continue;
      const decoded = decodePumpCurve(Buffer.from(info.data));
      if (decoded) out.set(mints[i].toBase58(), decoded);
    }
  } catch {}
  return out;
}

const DUMMY_WALLET = {
  publicKey: Keypair.generate().publicKey,
  signTransaction: async <T>(tx: T) => tx,
  signAllTransactions: async <T>(txs: T[]) => txs,
};

export function getReadOnlyProgram(connection: Connection): Program<Altsol> {
  const provider = new AnchorProvider(connection, DUMMY_WALLET as never, {
    commitment: "confirmed",
  });
  return new Program<Altsol>(idl as Altsol, provider);
}

function tsToIso(ts: number): string {
  return new Date(ts * 1000).toISOString();
}

function pubkeyOrNull(v: PublicKey | null | undefined): string | null {
  return v ? v.toBase58() : null;
}

// Hide obvious smoke-test launches (auto-named SMK### / "smoke test ..."). Set
// NEXT_PUBLIC_SHOW_TEST_LAUNCHES=1 to surface them too.
const HIDE_TEST_LAUNCHES = process.env.NEXT_PUBLIC_SHOW_TEST_LAUNCHES !== "1";

// Explicit per-mint blocklist for dev launches we never want shown.
const HIDDEN_MINTS: ReadonlySet<string> = new Set([
  "6e3NiF4ZKAaqebhiz3jeYqtYXz47r8BqrvvKhjec2q38", // TEST / TST (Mode A test)
  "Dx6XfGFKWgm6begrwwvx6ntmzfkptnBos5FsvqFKBApq", // pump.fun "LLP" Mode B test
]);

function isTestLaunch(account: { name?: string; symbol?: string }): boolean {
  if (!HIDE_TEST_LAUNCHES) return false;
  const name = (account.name ?? "").trim();
  const symbol = (account.symbol ?? "").trim();
  if (!name && !symbol) return true; // wholly unnamed launches
  if (symbol.startsWith("SMK")) return true;
  const lower = name.toLowerCase();
  if (lower.startsWith("smoke test")) return true;
  if (lower.startsWith("long longs probe")) return true;
  return false;
}

// Hide pump launches that have only the placeholder "pump.fun <dir>" name —
// these come from PumpLaunch accounts without resolved metadata.
function isPlaceholderPump(name: string | null | undefined): boolean {
  if (!name) return true;
  return /^pump\.fun\s+(long|short)$/i.test(name.trim());
}

function isHiddenMint(mint: string): boolean {
  return HIDDEN_MINTS.has(mint);
}

function readLocalImage(mint: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("lyl_token_images");
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, string>;
    return map[mint] ?? null;
  } catch {
    return null;
  }
}

function readLocalStub(mint: string): Partial<TokenListItem> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("lyl_token_stubs");
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, Partial<TokenListItem>>;
    return map[mint] ?? null;
  } catch {
    return null;
  }
}

async function fetchMeta(
  mint: string,
): Promise<{ name?: string; symbol?: string; image?: string | null }> {
  // localStorage shim wins — Mode A launches don't write Metaplex metadata,
  // and the form captured these values at submit time.
  const stub = readLocalStub(mint);
  if (stub?.name || stub?.symbol || stub?.image) {
    return {
      name: stub.name ?? undefined,
      symbol: stub.symbol ?? undefined,
      image: stub.image ?? readLocalImage(mint),
    };
  }
  // Server-side metadata POSTed at launch is shared across visitors.
  try {
    const res = await fetch(`/api/metadata/${mint}`);
    if (res.ok) {
      const data = (await res.json()) as {
        name?: string;
        symbol?: string;
        image?: string;
      };
      return {
        name: data.name,
        symbol: data.symbol,
        image: data.image ?? null,
      };
    }
  } catch {}
  return { image: readLocalImage(mint) };
}

// Backwards-compat wrapper for the existing call site.
async function fetchMetaImage(mint: string): Promise<string | null> {
  try {
    const meta = await fetchMeta(mint);
    return meta.image ?? null;
  } catch {
    return null;
  }
}

/// Anchor sha256("account:Launch")[0..8] and "account:PumpLaunch"[0..8].
const LAUNCH_DISC = Buffer.from([144, 51, 51, 163, 206, 85, 213, 38]);
const PUMP_LAUNCH_DISC = Buffer.from([142, 51, 20, 70, 67, 122, 52, 220]);

function bs58Encode(bytes: Uint8Array): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let zeros = 0;
  for (const b of bytes) {
    if (b === 0) zeros++;
    else break;
  }
  const digits: number[] = [];
  for (const b of bytes) {
    let carry = b;
    for (let i = 0; i < digits.length; i++) {
      carry += digits[i] << 8;
      digits[i] = carry % 58;
      carry = Math.floor(carry / 58);
    }
    while (carry) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }
  let s = "1".repeat(zeros);
  for (let i = digits.length - 1; i >= 0; i--) s += ALPHABET[digits[i]];
  return s;
}

/// Fetch + decode launches one-by-one. Skip legacy/short-buffer accounts that
/// fail to deserialize against the current IDL (residue from earlier program
/// versions before the v6 curve fields were added).
async function fetchAccountsTolerant<T>(
  connection: Connection,
  program: Program<Altsol>,
  accountName: "launch" | "pumpLaunch",
  discriminator: Buffer,
): Promise<Array<{ publicKey: PublicKey; account: T }>> {
  let raw: any[] = [];
  try {
    raw = (await connection.getProgramAccounts(program.programId, {
      dataSlice: { offset: 0, length: 0 },
      filters: [{ memcmp: { offset: 0, bytes: bs58Encode(discriminator) } }],
    })) as any[];
  } catch {
    return [];
  }
  const out: Array<{ publicKey: PublicKey; account: T }> = [];
  for (const { pubkey } of raw) {
    try {
      const acct = await (program.account as any)[accountName].fetch(pubkey);
      out.push({ publicKey: pubkey, account: acct });
    } catch {
      // legacy account format — skip silently
    }
  }
  return out;
}

export async function fetchAltsolLaunches(
  connection: Connection,
): Promise<TokenListItem[]> {
  const program = getReadOnlyProgram(connection);

  const [launches, pumpLaunches] = await Promise.all([
    fetchAccountsTolerant<any>(connection, program, "launch", LAUNCH_DISC),
    fetchAccountsTolerant<any>(
      connection,
      program,
      "pumpLaunch",
      PUMP_LAUNCH_DISC,
    ),
  ]);

  const visibleLaunches = launches.filter(
    ({ account }: any) =>
      !isTestLaunch(account) && !isHiddenMint(account.mint.toBase58()),
  );

  const perpMintPks = visibleLaunches.map(
    ({ account }: any) => new PublicKey(account.mint.toBase58()),
  );

  // Parallel fetch images from the app metadata API and Metaplex token metadata.
  const [metaImages, perpChainMetadataBatch] = await Promise.all([
    Promise.all(
      visibleLaunches.map(({ account }: any) =>
        fetchMetaImage(account.mint.toBase58()).then(
          (img) => [account.mint.toBase58(), img] as const,
        ),
      ),
    ),
    fetchTokenMetadataBatch(connection, perpMintPks),
  ]);
  const imageMap = new Map(metaImages);

  const TOTAL_TOKEN_SUPPLY = "1000000000000000000"; // 1B × 1e9, matches program constant
  const perpMapped: TokenListItem[] = visibleLaunches.map(
    ({ account }: any) => {
      const mintStr = account.mint.toBase58();
      const chain = perpChainMetadataBatch.get(mintStr);

      return {
        address: account.mint.toBase58(),
        name: account.name ?? null,
        symbol: account.symbol ?? null,
        image: imageMap.get(mintStr) ?? chain?.image ?? null,
        description: null,
        creator: pubkeyOrNull(account.creator),
        source: "perp",
        graduated: Boolean(account.isGraduated),
        created_at: tsToIso(Number(account.createdAt ?? 0)),
        first_seen_at: tsToIso(Number(account.createdAt ?? 0)),
        created_height: null,
        current_price: "0",
        reserves: account.realSolReserves?.toString() ?? "0",
        volume_24h: "0",
        trade_count_24h: 0,
        total_minted: account.totalMinted?.toString() ?? "0",
        total_supply: TOTAL_TOKEN_SUPPLY,
        real_sol_reserves: account.realSolReserves?.toString() ?? "0",
        fee_bps: account.feeBps ?? 0,
        perp_asset: account.hyperliquidPerpAsset ?? 0,
        leverage_bps: account.leverageBps ?? 0,
        direction: account.direction?.long !== undefined ? "long" : "short",
      };
    },
  );

  const visiblePumps = pumpLaunches.filter(
    ({ account }: any) => !isHiddenMint(account.pumpMint.toBase58()),
  );

  // Resolve metadata for each pump launch in parallel from three sources:
  //   - localStorage stub (creator's browser, instant)
  //   - /api/metadata (server-persisted at launch, multi-device)
  //   - on-chain token metadata (truth, works for pump.fun launches we didn't create)
  const pumpMintPks = visiblePumps.map(
    ({ account }: any) => new PublicKey(account.pumpMint.toBase58()),
  );
  const [pumpMetas, pumpCurves, chainMetadataBatch] = await Promise.all([
    Promise.all(
      visiblePumps.map(({ account }: any) =>
        fetchMeta(account.pumpMint.toBase58()),
      ),
    ),
    fetchPumpBondingCurves(connection, pumpMintPks),
    fetchTokenMetadataBatch(connection, pumpMintPks),
  ]);

  const pumpMapped: TokenListItem[] = visiblePumps.map(
    ({ account }: any, i: number) => {
      const dir = account.direction?.long !== undefined ? "long" : "short";
      const mintStr = account.pumpMint.toBase58();
      const stub = readLocalStub(mintStr);
      const meta = pumpMetas[i];
      const chain = chainMetadataBatch.get(mintStr);
      const curve = pumpCurves.get(mintStr);
      // PumpLaunch stores the perp index under referencePerpMarketIndex, NOT
      // hyperliquidPerpAsset. Fall back to the stub the form persisted so the
      // user's chosen perp is honored even if on-chain decoding is partial.
      const perpAsset =
        account.referencePerpMarketIndex !== undefined
          ? Number(account.referencePerpMarketIndex)
          : (stub?.perp_asset ?? 0);
      // Pump.fun bonding curve reserves drive Mode B's liquidity/MC math.
      // total_minted = initial_virtual_tokens - current_virtual_tokens (i.e.
      // how much has been minted out of the curve). real_sol_reserves is the
      // SOL actually held by the curve's vault.
      const virtTokensNow = curve ? Number(curve.virtualTokenReserves) : 0;
      const realSol = curve ? Number(curve.realSolReserves) : 0;
      const minted = curve
        ? Math.max(PUMP_VIRTUAL_TOKENS_INITIAL - virtTokensNow, 0)
        : 0;
      return {
        address: mintStr,
        name: meta.name ?? stub?.name ?? chain?.name ?? `pump.fun ${dir}`,
        symbol:
          meta.symbol ?? stub?.symbol ?? chain?.symbol ?? dir.toUpperCase(),
        image:
          meta.image ?? stub?.image ?? chain?.image ?? readLocalImage(mintStr),
        description:
          stub?.description ??
          `creator fees auto-${dir} on Hyperliquid perp ${account.referencePerpMarketIndex}`,
        creator: pubkeyOrNull(account.creator),
        source: "pump",
        graduated: curve?.complete ?? false,
        created_at: tsToIso(Number(account.createdAt ?? 0)),
        first_seen_at: tsToIso(Number(account.createdAt ?? 0)),
        created_height: null,
        current_price: "0",
        reserves: realSol.toString(),
        real_sol_reserves: realSol.toString(),
        total_minted: minted.toString(),
        total_supply: curve
          ? curve.tokenTotalSupply.toString()
          : "1000000000000000",
        decimals: 6,
        virtual_tokens_initial: PUMP_VIRTUAL_TOKENS_INITIAL.toString(),
        volume_24h: "0",
        trade_count_24h: 0,
        perp_asset: perpAsset,
        leverage_bps: stub?.leverage_bps ?? 30_000,
        direction: dir as "long" | "short",
      };
    },
  );

  return [...perpMapped, ...pumpMapped];
}

export async function fetchAltsolLaunchByAddress(
  connection: Connection,
  address: string,
): Promise<TokenListItem | null> {
  const all = await fetchAltsolLaunches(connection);
  return all.find((t) => t.address === address) ?? null;
}

export interface LaunchActivity {
  signature: string;
  slot: number;
  blockTime: number | null;
  kind: "buy" | "sell" | "init" | "release" | "other";
  signer: string;
  /** Net SOL delta for the signer in this tx, in SOL (signed: negative = paid). */
  solDelta?: number;
  /** Net token delta for the signer in this tx, in whole tokens (signed). */
  tokenDelta?: number;
  /** Solana network fee paid for the tx, in SOL. */
  networkFee?: number;
}

/// Pull recent program-account txs for the launch PDA. Cheap heuristic: parse
/// the log lines emitted by Anchor's `Instruction: ...` to classify. No event
/// parsing yet (would need a BorshCoder pass).
export async function fetchLaunchActivity(
  connection: Connection,
  mintAddress: string,
  limit = 25,
): Promise<LaunchActivity[]> {
  const program = getReadOnlyProgram(connection);
  let mint: PublicKey;
  try {
    mint = new PublicKey(mintAddress);
  } catch {
    return [];
  }
  const [launchPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("launch"), mint.toBuffer()],
    program.programId,
  );
  const sigs = await connection
    .getSignaturesForAddress(launchPda, { limit })
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
  const out: LaunchActivity[] = [];
  for (let i = 0; i < sigs.length; i++) {
    const sig = sigs[i];
    const tx = txs[i];
    if (!tx) continue;
    const logs: string[] = tx.meta?.logMessages ?? [];
    const ixLog = logs.find((l) => l.startsWith("Program log: Instruction:"));
    let kind: LaunchActivity["kind"] = "other";
    if (ixLog?.includes("Buy")) kind = "buy";
    else if (ixLog?.includes("Sell")) kind = "sell";
    else if (ixLog?.includes("InitLaunch") || ixLog?.includes("init_launch"))
      kind = "init";
    else if (
      ixLog?.includes("ReleaseToBridge") ||
      ixLog?.includes("release_to_bridge")
    )
      kind = "release";
    const accountKeys = tx.transaction.message.staticAccountKeys ?? [];
    const signer = accountKeys[0]?.toBase58() ?? "?";

    // SOL delta for the signer (account index 0) — preBalances/postBalances
    // are in lamports.
    let solDelta: number | undefined;
    if (tx.meta?.preBalances && tx.meta?.postBalances) {
      const pre = tx.meta.preBalances[0] ?? 0;
      const post = tx.meta.postBalances[0] ?? 0;
      solDelta = (post - pre) / 1e9;
    }
    const networkFee =
      tx.meta?.fee !== undefined ? tx.meta.fee / 1e9 : undefined;

    // Token delta for the signer on this launch's mint.
    let tokenDelta: number | undefined;
    if (tx.meta?.preTokenBalances && tx.meta?.postTokenBalances) {
      const mintStr = mint.toBase58();
      const matchSigner = (b: {
        owner?: string;
        mint?: string;
        uiTokenAmount?: { uiAmount?: number | null };
      }) => b.owner === signer && b.mint === mintStr;
      const preTok =
        tx.meta.preTokenBalances.find(matchSigner)?.uiTokenAmount?.uiAmount ??
        0;
      const postTok =
        tx.meta.postTokenBalances.find(matchSigner)?.uiTokenAmount?.uiAmount ??
        0;
      tokenDelta = (postTok ?? 0) - (preTok ?? 0);
    }

    out.push({
      signature: sig.signature,
      slot: sig.slot,
      blockTime: sig.blockTime ?? null,
      kind,
      signer,
      solDelta,
      tokenDelta,
      networkFee,
    });
  }
  return out;
}
