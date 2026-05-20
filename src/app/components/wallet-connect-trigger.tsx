"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletConnect } from "./wallet-connect-modal";

export default function WalletConnectTrigger({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  const { open } = useWalletConnect();
  const { connected, publicKey } = useWallet();

  if (connected && publicKey) {
    const pk = publicKey.toBase58();
    return (
      <button
        type="button"
        className={className}
        onClick={open}
        title="Click to disconnect"
      >
        {pk.slice(0, 4)}…{pk.slice(-4)}
      </button>
    );
  }

  return (
    <button type="button" className={className} onClick={open}>
      {children}
    </button>
  );
}
