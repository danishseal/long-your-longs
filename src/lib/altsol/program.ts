"use client";

import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import {
  useAnchorWallet,
  useConnection,
  type AnchorWallet,
} from "@solana/wallet-adapter-react";
import { useMemo } from "react";
import idl from "./altsol-idl.json";
import type { Altsol } from "./altsol-types";

export function useAltsolProgram(): Program<Altsol> | null {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  return useMemo(() => {
    if (!wallet) return null;
    return buildAltsolProgram(connection, wallet);
  }, [connection, wallet]);
}

export function buildAltsolProgram(
  connection: Connection,
  wallet: AnchorWallet
): Program<Altsol> {
  const provider = new AnchorProvider(connection, wallet as never, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  return new Program<Altsol>(idl as Altsol, provider);
}
