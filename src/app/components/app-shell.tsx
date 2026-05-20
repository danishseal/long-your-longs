"use client";

import {
  CaretDoubleLeft,
  CaretDoubleRight,
  Coins,
  House,
  List,
  MagnifyingGlass,
  TelegramLogo,
  X,
  XLogo,
} from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { TickerItem } from "../lib/token-data";
import HowItWorksModal from "./how-it-works-modal";
import { SearchProvider } from "./search-modal";
import SearchTrigger from "./search-trigger";
import { WalletConnectProvider } from "./wallet-connect-modal";
import WalletConnectTrigger from "./wallet-connect-trigger";

type SidebarAction = "openHowItWorks";
const sidebarItems: Array<{
  label: string;
  icon: typeof House;
  href?: string;
  action?: SidebarAction;
}> = [
  { label: "Home", icon: House, href: "/home" },
  { label: "How It Works", icon: Coins, action: "openHowItWorks" },
  { label: "Docs", icon: List, href: "/docs" },
];

function TickerCoinIcon({ symbol }: { symbol: string }) {
  const [showFallback, setShowFallback] = useState(false);

  if (showFallback) {
    return (
      <span className="flex size-4 items-center justify-center rounded-full bg-[#065f46] text-[8px] font-bold text-[#f5f2ed]">
        {symbol.replace(/^k/, "").slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`https://app.hyperliquid.xyz/coins/${symbol}.svg`}
      alt=""
      width={16}
      height={16}
      className="size-4 rounded-full"
      loading="lazy"
      onError={() => setShowFallback(true)}
    />
  );
}

export default function AppShell({
  children,
  showTicker = true,
}: {
  children: React.ReactNode;
  showTicker?: boolean;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([]);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const pathname = usePathname();

  const isItemActive = (href?: string) => {
    if (!href) return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  useEffect(() => {
    let active = true;

    async function loadTickerItems() {
      try {
        const response = await fetch("/api/hyperliquid-ticker");

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as { items?: TickerItem[] };

        if (active && Array.isArray(data.items)) {
          setTickerItems(data.items);
        }
      } catch {
        // Keep the ticker hidden if Hyperliquid is unavailable.
      }
    }

    loadTickerItems();

    return () => {
      active = false;
    };
  }, []);

  return (
    <SearchProvider>
      <WalletConnectProvider>
        <main className="min-h-screen bg-[#f5f2ed] text-[#17372d]">
          <div className="flex min-h-screen">
            {mobileSidebarOpen ? (
              <button
                type="button"
                aria-label="Close menu overlay"
                className="fixed inset-0 z-20 bg-[#17372d]/35 md:hidden"
                onClick={() => setMobileSidebarOpen(false)}
              />
            ) : null}

            <aside
              className={`fixed inset-y-0 left-0 z-30 flex flex-col border-r border-[#065f46]/15 bg-[#f5f2ed] transition-[width,transform] duration-200 md:z-10 ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} ${sidebarCollapsed ? "w-[76px]" : "w-[252px]"}`}
            >
              <div className="relative flex items-center justify-center px-3 pb-2 pt-[22px]">
                <a
                  href="/home"
                  className="flex items-center justify-center text-[#065f46] transition-opacity hover:opacity-80"
                >
                  <span className="sr-only">Long Your Longs</span>
                  <Image
                    src="/green-belan.png"
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 object-contain"
                    priority
                  />
                </a>
                <button
                  type="button"
                  aria-label={
                    sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }
                  onClick={() => {
                    if (mobileSidebarOpen) {
                      setMobileSidebarOpen(false);
                      return;
                    }

                    setSidebarCollapsed((value) => !value);
                  }}
                  className={`inline-flex items-center justify-center bg-[#e6ddd0] text-[#065f46] hover:bg-[#d8ccbd] ${sidebarCollapsed ? "absolute -right-2.5 top-6 size-5 rounded-sm p-0" : "absolute right-3 top-1/2 size-5 -translate-y-1/2 rounded-sm p-0"}`}
                >
                  {mobileSidebarOpen ? (
                    <X size={14} weight="bold" />
                  ) : sidebarCollapsed ? (
                    <CaretDoubleRight size={10} weight="bold" />
                  ) : (
                    <CaretDoubleLeft size={14} weight="bold" />
                  )}
                </button>
              </div>

              <nav className="flex-1 overflow-auto px-3 pt-2">
                {!sidebarCollapsed ? (
                  <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8aa296]">
                    Browse
                  </div>
                ) : null}
                {sidebarItems.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.href);
                  const linkClass = `group relative mb-0.5 box-border flex h-9 w-full appearance-none items-center overflow-hidden rounded-md border-0 px-2 text-left text-[17px] font-medium leading-none transition-colors ${sidebarCollapsed ? "justify-center" : "justify-start"} ${active ? "bg-[#e6ddd0]/70 text-[#17372d]" : "bg-transparent text-[#17372d] hover:bg-[#e6ddd0]/25 hover:text-[#065f46]"}`;
                  const content = (
                    <>
                      {active ? (
                        <span
                          aria-hidden
                          className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-[#065f46]"
                        />
                      ) : null}
                      <span
                        className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}
                      >
                        <Icon size={16} weight="regular" />
                        <span
                          className={
                            sidebarCollapsed
                              ? "hidden text-[17px] font-medium leading-none"
                              : "block text-[17px] font-medium leading-none"
                          }
                        >
                          {item.label}
                        </span>
                      </span>
                    </>
                  );
                  if (item.action === "openHowItWorks") {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setHowItWorksOpen(true)}
                        className={linkClass}
                      >
                        {content}
                      </button>
                    );
                  }
                  if (item.href) {
                    return (
                      <a
                        key={item.label}
                        href={item.href}
                        className={linkClass}
                      >
                        {content}
                      </a>
                    );
                  }
                  return (
                    <button
                      key={item.label}
                      type="button"
                      className={linkClass}
                    >
                      {content}
                    </button>
                  );
                })}
              </nav>

              <div className="border-t border-[#065f46]/10 px-3 pb-3 pt-3 text-[#17372d]">
                {!sidebarCollapsed ? (
                  <div className="mb-2 flex items-center gap-1.5 px-2 text-[10px] font-medium tracking-wide text-[#6f857c]">
                    <span
                      aria-hidden
                      className="inline-block size-1.5 animate-pulse rounded-full bg-[#10b981]"
                    />
                    <span>Solana mainnet</span>
                  </div>
                ) : (
                  <div className="mb-2 flex justify-center">
                    <span
                      aria-hidden
                      className="inline-block size-1.5 animate-pulse rounded-full bg-[#10b981]"
                    />
                  </div>
                )}
                <div className="space-y-0.5">
                  <a
                    href="https://x.com/lyldotfun"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex rounded-md px-2 py-1.5 text-[13px] font-medium text-[#17372d] hover:bg-[#e6ddd0]/60 hover:text-[#065f46] ${sidebarCollapsed ? "justify-center" : "items-center gap-2.5"}`}
                  >
                    <XLogo size={14} />
                    <span className={sidebarCollapsed ? "hidden" : "block"}>
                      Twitter
                    </span>
                  </a>
                  <a
                    href="https://t.me/lyldotfun"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex rounded-md px-2 py-1.5 text-[13px] font-medium text-[#17372d] hover:bg-[#e6ddd0]/60 hover:text-[#065f46] ${sidebarCollapsed ? "justify-center" : "items-center gap-2.5"}`}
                  >
                    <TelegramLogo size={14} weight="fill" />
                    <span className={sidebarCollapsed ? "hidden" : "block"}>
                      Telegram
                    </span>
                  </a>
                </div>
              </div>
            </aside>

            <section
              className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ${sidebarCollapsed ? "md:ml-[76px]" : "md:ml-[252px]"}`}
            >
              <header className="flex items-center justify-between gap-3 border-b border-[#065f46]/15 px-4 py-2 md:min-h-[75px] md:justify-end md:px-5 md:py-3">
                <a href="/" className="block md:hidden">
                  <span className="sr-only">Long Your Longs</span>
                  <Image
                    src="/green-belan.png"
                    alt=""
                    width={32}
                    height={32}
                    className="size-8 object-contain"
                    priority
                  />
                </a>
                <div className="mr-auto w-full max-w-[36px] md:max-w-[240px]">
                  <SearchTrigger className="flex items-center justify-center gap-2 rounded-sm border border-[#065f46]/15 bg-[#fffaf3] px-2 py-2 text-sm text-[#547468] transition-all duration-150 ease-out hover:border-[#065f46]/35 hover:text-[#065f46] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#065f46]/20 lg:h-auto lg:w-full lg:max-w-[240px] lg:justify-start lg:pl-3">
                    <MagnifyingGlass size={14} className="shrink-0" />
                    <span className="hidden lg:block">Search</span>
                    <kbd className="ml-auto hidden h-5 min-w-5 items-center justify-center rounded-sm bg-[#e6ddd0] px-1 font-sans text-[10px] font-medium text-[#547468] lg:flex">
                      Ctrl K
                    </kbd>
                  </SearchTrigger>
                </div>
                <nav className="flex items-center justify-end gap-2 md:gap-4">
                  <a
                    href="/create"
                    className="inline-flex h-7 items-center justify-center rounded-sm bg-[#065f46] px-2 text-[10px] font-semibold !text-white transition-colors hover:bg-[#054c38] md:h-auto md:px-3 md:py-2 lg:text-sm"
                  >
                    Launch Token
                  </a>
                  <WalletConnectTrigger className="flex h-7 items-center justify-center rounded-sm border border-[#065f46] bg-transparent px-3 text-xs font-medium text-[#065f46] transition-colors hover:bg-[#065f46] hover:text-[#f5f2ed] md:h-9 md:px-4 md:text-sm">
                    Log In
                  </WalletConnectTrigger>
                  <div className="flex items-center gap-2 md:gap-3">
                    <button
                      type="button"
                      aria-label="Open menu"
                      className="md:hidden"
                      onClick={() => setMobileSidebarOpen(true)}
                    >
                      <List size={16} weight="bold" />
                    </button>
                  </div>
                </nav>
              </header>

              {showTicker && tickerItems.length > 0 ? (
                <div className="overflow-hidden border-b border-[#065f46]/15 bg-[#f5f2ed]">
                  <div className="ticker-track flex min-w-max items-center text-[12px] text-[#547468]">
                    {[...tickerItems, ...tickerItems].map((item, index) => {
                      const negative = item.change.startsWith("-");
                      return (
                        <a
                          key={`${item.symbol}-${index}`}
                          href={`https://app.hyperliquid.xyz/trade/${item.symbol}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex shrink-0 items-center gap-2.5 border-r border-[#065f46]/15 px-4 py-1 transition-colors hover:bg-[#065f46]/5"
                          title={`Trade ${item.symbol} on Hyperliquid`}
                        >
                          <TickerCoinIcon symbol={item.symbol} />
                          <span>{item.symbol}</span>
                          <span
                            className={
                              negative ? "text-[#b42318]" : "text-[#065f46]"
                            }
                          >
                            {item.change}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {children}
            </section>
          </div>
        </main>
      </WalletConnectProvider>
      <HowItWorksModal
        open={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
      />
    </SearchProvider>
  );
}
