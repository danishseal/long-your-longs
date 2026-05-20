"use client";

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import pumpIdl from "./pumpfun-idl.json";
import { PUMPFUN_PROGRAM_ID } from "./constants";

const MPL_TOKEN_METADATA = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const DUMMY_WALLET = {
  publicKey: Keypair.generate().publicKey,
  signTransaction: async <T>(tx: T) => tx,
  signAllTransactions: async <T>(txs: T[]) => txs,
};

function findPda(seeds: (Buffer | Uint8Array)[], programId: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(seeds, programId)[0];
}

export function deriveBondingCurve(mint: PublicKey): PublicKey {
  return findPda([Buffer.from("bonding-curve"), mint.toBuffer()], PUMPFUN_PROGRAM_ID);
}

export function deriveMintAuthority(): PublicKey {
  return findPda([Buffer.from("mint-authority")], PUMPFUN_PROGRAM_ID);
}

export function deriveGlobal(): PublicKey {
  return findPda([Buffer.from("global")], PUMPFUN_PROGRAM_ID);
}

export function derivePumpEventAuthority(): PublicKey {
  return findPda([Buffer.from("__event_authority")], PUMPFUN_PROGRAM_ID);
}

export function deriveMetadata(mint: PublicKey): PublicKey {
  return findPda(
    [Buffer.from("metadata"), MPL_TOKEN_METADATA.toBuffer(), mint.toBuffer()],
    MPL_TOKEN_METADATA
  );
}

export interface PumpCreateArgs {
  name: string;
  symbol: string;
  uri: string;
  creator: PublicKey;
}

export async function buildPumpCreateIx(
  connection: Connection,
  user: PublicKey,
  mint: PublicKey,
  args: PumpCreateArgs
): Promise<TransactionInstruction> {
  const provider = new AnchorProvider(connection, DUMMY_WALLET as never, {
    commitment: "confirmed",
  });
  const program = new Program(pumpIdl as never, provider);

  const bondingCurve = deriveBondingCurve(mint);
  const mintAuthority = deriveMintAuthority();
  const associatedBondingCurve = getAssociatedTokenAddressSync(
    mint,
    bondingCurve,
    true
  );
  const global = deriveGlobal();
  const metadata = deriveMetadata(mint);
  const eventAuthority = derivePumpEventAuthority();

  return await (program.methods as any)
    .create(args.name, args.symbol, args.uri, args.creator)
    .accounts({
      mint,
      mintAuthority,
      bondingCurve,
      associatedBondingCurve,
      global,
      mplTokenMetadata: MPL_TOKEN_METADATA,
      metadata,
      user,
      systemProgram: SystemProgram.programId,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      rent: SYSVAR_RENT_PUBKEY,
      eventAuthority,
      program: PUMPFUN_PROGRAM_ID,
    })
    .instruction();
}
