"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Button } from "@/components/ui/button";
import { Wallet } from "@phosphor-icons/react";

interface SolanaConnectButtonProps {
  label?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  showIcon?: boolean;
}

function truncate(value: string, size: number): string {
  if (value.length <= size * 2) return value;
  return `${value.slice(0, size)}...${value.slice(-size)}`;
}

export function SolanaConnectButton({
  label = "connect wallet",
  className,
  variant = "default",
  showIcon = true,
}: SolanaConnectButtonProps = {}) {
  const { publicKey, connected, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  if (connected && publicKey) {
    const short = truncate(publicKey.toBase58(), 4);
    return (
      <Button
        type="button"
        onClick={() => disconnect()}
        variant={variant}
        className={className}
        title="Disconnect"
      >
        {showIcon ? <Wallet size={16} weight="fill" /> : null}
        {showIcon ? short : `[${short}]`}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => setVisible(true)}
      disabled={connecting}
      variant={variant}
      className={className}
    >
      {showIcon ? <Wallet size={16} weight="fill" /> : null}
      {showIcon ? (connecting ? "Connecting..." : label) : `[${connecting ? "connecting..." : label}]`}
    </Button>
  );
}
