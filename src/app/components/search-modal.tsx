"use client";

import { MagnifyingGlass, X } from "@phosphor-icons/react/dist/ssr";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTokens } from "@/hooks/use-tokens";
import type { TokenListItem } from "@/lib/api";
import { TokenArtwork } from "./token-artwork";

type SearchContextValue = {
  open: () => void;
  close: () => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const openShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k";

      if (openShortcut) {
        event.preventDefault();
        setIsOpen(true);
        return;
      }

      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const value = useMemo(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [],
  );

  return (
    <SearchContext.Provider value={value}>
      {children}
      {isOpen ? <SearchDialog onClose={value.close} /> : null}
    </SearchContext.Provider>
  );
}

export function useSearchModal() {
  const context = useContext(SearchContext);

  if (!context) {
    throw new Error("useSearchModal must be used within SearchProvider");
  }

  return context;
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState("");
  const { data: launches, isLoading } = useTokens();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const items = Array.isArray(launches) ? launches : [];

    if (!normalizedQuery) {
      return [...items]
        .sort(
          (a, b) =>
            ts(b.first_seen_at ?? b.created_at) -
            ts(a.first_seen_at ?? a.created_at),
        )
        .slice(0, 8);
    }

    return [...items]
      .map((token) => ({
        token,
        score: getTokenSearchScore(token, normalizedQuery),
      }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((entry) => entry.token);
  }, [launches, query]);

  const sectionLabel = query.trim() ? "RESULTS" : "TRENDING";

  const openToken = (address: string) => {
    onClose();
    setQuery("");
    router.push(`/token/${address}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24 md:pt-44">
      <button
        type="button"
        aria-label="Close search modal"
        className="absolute inset-0 bg-[#17372d]/35 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[640px] overflow-hidden rounded-xl border border-[#065f46]/15 bg-[#fffaf3] shadow-[0_24px_80px_rgba(23,55,45,0.22)]">
        <div className="flex items-center gap-3 border-b border-[#065f46]/15 px-4 py-4">
          <MagnifyingGlass size={18} className="shrink-0 text-[#547468]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && results[0]) {
                openToken(results[0].address);
              } else if (event.key === "Enter") {
                const maybeAddress = query.trim();
                if (maybeAddress.length >= 32) {
                  openToken(maybeAddress);
                }
              }
            }}
            placeholder="Search tokens..."
            className="w-full bg-transparent text-[1.05rem] text-[#17372d] outline-none placeholder:text-[#6f857c]"
          />
          <button
            type="button"
            aria-label="Close search"
            className="inline-flex size-7 items-center justify-center rounded-sm text-[#547468] transition-colors hover:bg-[#e6ddd0] hover:text-[#065f46]"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3">
          <p className="text-xs font-semibold tracking-[0.12em] text-[#6f857c]">
            {sectionLabel}
          </p>
        </div>

        {isLoading ? (
          <div className="px-4 pb-5 pt-2 text-sm text-[#6f857c]">
            Loading tokens...
          </div>
        ) : results.length ? (
          <div className="overflow-x-auto px-4 pb-4">
            <div className="grid auto-cols-[160px] grid-flow-col gap-2">
              {results.map((token) => (
                <button
                  key={token.address}
                  type="button"
                  onClick={() => openToken(token.address)}
                  className="overflow-hidden rounded-md border border-[#065f46]/15 bg-[#f5f2ed] text-left transition-colors hover:border-[#065f46]/35 hover:bg-[#e6ddd0]"
                >
                  <div className="h-28 overflow-hidden">
                    <TokenArtwork
                      type={
                        (token.symbol ?? token.address)
                          .replace(/[^A-Z0-9]/gi, "")
                          .slice(0, 10) || token.address.slice(0, 10)
                      }
                      imageUrl={token.image}
                    />
                  </div>
                  <div className="space-y-1.5 px-3 py-3">
                    <div>
                      <p className="truncate text-[0.95rem] font-semibold text-[#17372d]">
                        {token.name ?? "Untitled"}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#6f857c]">
                        <span className="truncate uppercase">
                          {token.symbol ?? "\u2014"}
                        </span>
                        <span className="text-[#065f46]/30">.</span>
                        <span className="truncate">
                          {ageFromIso(token.first_seen_at ?? token.created_at)}
                        </span>
                      </div>
                    </div>
                    {token.source === "pump" ? (
                      <span className="inline-flex rounded bg-[#065f46]/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-[#065f46]">
                        PUMP
                      </span>
                    ) : token.graduated ? (
                      <span className="inline-flex rounded bg-[#065f46]/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-[#065f46]">
                        LIVE
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="px-4 pb-5 pt-2 text-sm text-[#6f857c]">
            No tokens found for "{query}".
          </div>
        )}
      </div>
    </div>
  );
}

function ts(iso: string | null | undefined): number {
  return iso ? new Date(iso).getTime() : 0;
}

function ageFromIso(iso: string | null | undefined): string {
  if (!iso) return "\u2014";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function getTokenSearchScore(token: TokenListItem, query: string) {
  const fields = [
    (token.name ?? "").toLowerCase(),
    (token.symbol ?? "").toLowerCase(),
    (token.address ?? "").toLowerCase(),
    (token.creator ?? "").toLowerCase(),
  ];

  let score = 0;

  for (const field of fields) {
    if (!field) {
      continue;
    }

    if (field === query) {
      score += 120;
      continue;
    }

    if (field.startsWith(query)) {
      score += 80;
      continue;
    }

    if (field.includes(query)) {
      score += 40;
    }
  }

  return score;
}
