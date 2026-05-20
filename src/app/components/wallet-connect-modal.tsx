"use client";

import { X } from "@phosphor-icons/react/dist/ssr";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import type { Wallet } from "@solana/wallet-adapter-react";

type WalletConnectContextValue = {
  open: () => void;
  close: () => void;
};

const WalletConnectContext = createContext<WalletConnectContextValue | null>(
  null,
);

export function WalletConnectProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { connected, disconnect } = useWallet();

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const value = useMemo<WalletConnectContextValue>(
    () => ({
      open: () => {
        // If already connected, the Log In button doubles as disconnect.
        if (connected) {
          void disconnect();
          return;
        }
        setIsOpen(true);
      },
      close: () => setIsOpen(false),
    }),
    [connected, disconnect],
  );

  return (
    <WalletConnectContext.Provider value={value}>
      {children}
      {isOpen ? <WalletConnectDialog onClose={value.close} /> : null}
    </WalletConnectContext.Provider>
  );
}

export function useWalletConnect() {
  const context = useContext(WalletConnectContext);
  if (!context) {
    throw new Error(
      "useWalletConnect must be used within WalletConnectProvider",
    );
  }
  return context;
}

// Hide off-brand auto-injected wallets we don't want to surface.
const HIDDEN_WALLETS = /bwick/i;

function WalletConnectDialog({ onClose }: { onClose: () => void }) {
  const { wallets, select, connected } = useWallet();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connected) onClose();
  }, [connected, onClose]);

  async function pickWallet(w: Wallet) {
    setError(null);
    setBusy(w.adapter.name);
    try {
      // Record the selection so the WalletProvider's autoConnect works on
      // future page loads.
      select(w.adapter.name);
      if (w.adapter.connected) {
        onClose();
        return;
      }
      // Connect via the adapter directly — calling connect() from useWallet()
      // would use the previous render's snapshot and silently no-op.
      await w.adapter.connect();
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message.replace(/^WalletConnectionError:\s*/, "")
          : "Connection failed";
      console.error("wallet connect:", e);
      setError(msg);
    } finally {
      setBusy(null);
    }
  }

  const ordered = [...wallets]
    .filter((w) => !HIDDEN_WALLETS.test(w.adapter.name))
    .sort((a, b) => {
      const order: Record<string, number> = {
        Installed: 0,
        Loadable: 1,
        NotDetected: 2,
        Unsupported: 3,
      };
      return (order[a.readyState] ?? 9) - (order[b.readyState] ?? 9);
    });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close wallet modal"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-[440px] rounded-2xl border border-[#065f46]/15 bg-[#fffaf3] p-6 shadow-xl md:p-8">
        <button
          type="button"
          aria-label="Close modal"
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-full text-[#647067] hover:bg-[#e6ddd0]/60 hover:text-[#17372d]"
          onClick={onClose}
        >
          <X size={16} />
        </button>

        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f857c]">
          wallet
        </div>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#17372d]">
          Connect a wallet
        </h2>
        <p className="mt-1 text-[13px] text-[#647067]">
          We use Solana wallets. Phantom and Solflare are recommended.
        </p>

        {error ? (
          <div className="mt-4 rounded-md border border-[#b42318]/30 bg-[#b42318]/8 px-3 py-2 text-[12px] text-[#b42318]">
            {error}
          </div>
        ) : null}

        <div className="mt-6 space-y-2">
          {ordered.length === 0 ? (
            <p className="text-sm text-[#647067]">
              No wallets detected. Install Phantom, Solflare, or Backpack.
            </p>
          ) : (
            ordered.map((w) => {
              const isBusy = busy === w.adapter.name;
              const isInstalled = w.readyState === "Installed";
              const isUnsupported = w.readyState === "Unsupported";
              return (
                <button
                  key={w.adapter.name}
                  type="button"
                  disabled={isBusy || isUnsupported}
                  onClick={() => pickWallet(w)}
                  className="flex h-12 w-full items-center gap-3 rounded-lg border border-[#065f46]/15 bg-[#f5f2ed] px-3 text-left text-[14px] font-semibold text-[#17372d] transition-colors hover:bg-[#e6ddd0]/60 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {w.adapter.icon ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={w.adapter.icon}
                      alt=""
                      width={24}
                      height={24}
                      className="size-6 rounded-md"
                    />
                  ) : (
                    <span className="inline-block size-6 rounded-md bg-[#065f46]/20" />
                  )}
                  <span className="flex-1">{w.adapter.name}</span>
                  <span className="text-[11px] font-normal text-[#647067]">
                    {isBusy
                      ? "connecting..."
                      : isInstalled
                        ? "detected"
                        : w.readyState}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
