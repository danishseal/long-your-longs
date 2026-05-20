"use client";

import { CaretDown, MagnifyingGlass, X } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export type PerpAsset = {
  index: number;
  symbol: string;
  markPx: number;
  change: number;
  dayNtlVlm?: number;
};

function formatPrice(px: number): string {
  if (!Number.isFinite(px) || px <= 0) return "—";
  if (px >= 1000) return `$${px.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (px >= 1) return `$${px.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (px >= 0.01) return `$${px.toFixed(4)}`;
  return `$${px.toPrecision(3)}`;
}

function formatChange(pct: number): { label: string; positive: boolean } {
  const positive = pct >= 0;
  return {
    label: `${positive ? "+" : ""}${pct.toFixed(2)}%`,
    positive,
  };
}

function CoinIcon({ symbol, size = 18 }: { symbol: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  if (broken) {
    return (
      <span
        className="flex shrink-0 items-center justify-center rounded-full bg-[#065f46] text-[10px] font-bold text-[#f5f2ed]"
        style={{ width: size, height: size }}
      >
        {symbol.replace(/^k/, "").slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={`https://app.hyperliquid.xyz/coins/${symbol}.svg`}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full"
      onError={() => setBroken(true)}
      loading="lazy"
    />
  );
}

export function PerpPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (index: number) => void;
  disabled?: boolean;
}) {
  const [assets, setAssets] = useState<PerpAsset[]>([]);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropUp, setDropUp] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useLayoutEffect(() => {
    if (!open || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    // Prefer downward, but flip up if not enough space below and there's more above.
    setDropUp(spaceBelow < 320 && spaceAbove > spaceBelow);
  }, [open]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const r = await fetch("/api/hyperliquid-perps");
        if (!r.ok) return;
        const data = (await r.json()) as { assets?: PerpAsset[] };
        if (active && Array.isArray(data.assets)) setAssets(data.assets);
      } catch {}
    }
    load();
    const id = setInterval(load, 30_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    setTimeout(() => searchRef.current?.focus(), 30);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const selected = useMemo<PerpAsset | undefined>(() => {
    return assets.find((a) => a.index === value);
  }, [assets, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return assets;
    return assets.filter((a) => a.symbol.toUpperCase().includes(q));
  }, [assets, query]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-10 w-full items-center gap-2.5 rounded-none border border-[#065f46]/15 bg-[#f5f2ed] px-3 text-left text-sm text-[#17372d] transition-colors hover:border-[#065f46]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#065f46]/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {selected ? (
          <>
            <CoinIcon symbol={selected.symbol} size={20} />
            <span className="flex-1 font-bold">{selected.symbol}</span>
            <span className="text-[12px] tabular-nums text-[#17372d]">
              {formatPrice(selected.markPx)}
            </span>
            <span
              className={`text-[11px] font-medium tabular-nums ${formatChange(selected.change).positive ? "text-[#065f46]" : "text-[#b42318]"}`}
            >
              {formatChange(selected.change).label}
            </span>
          </>
        ) : (
          <span className="flex-1 text-[#6f857c]">
            {assets.length === 0 ? "loading perps..." : "select perp"}
          </span>
        )}
        <CaretDown size={14} className={`shrink-0 text-[#6f857c] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="listbox"
          className={`absolute left-0 right-0 z-50 max-h-[360px] overflow-hidden rounded-md border border-[#065f46]/20 bg-[#fffaf3] shadow-xl animate-fade-in ${dropUp ? "bottom-[calc(100%+4px)]" : "top-[calc(100%+4px)]"}`}
        >
          <div className="flex items-center gap-2 border-b border-[#065f46]/12 bg-[#f5f2ed] px-3 py-2">
            <MagnifyingGlass size={14} className="shrink-0 text-[#6f857c]" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search perps..."
              className="h-6 flex-1 bg-transparent text-sm text-[#17372d] placeholder:text-[#6f857c] focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="text-[#6f857c] hover:text-[#065f46]"
              >
                <X size={12} weight="bold" />
              </button>
            ) : null}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-[#6f857c]">no perps match</div>
            ) : (
              filtered.map((a) => {
                const c = formatChange(a.change);
                const isSelected = a.index === value;
                return (
                  <button
                    key={a.index}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(a.index);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`flex w-full items-center gap-2.5 border-b border-[#065f46]/8 px-3 py-2 text-left text-sm transition-colors last:border-0 ${isSelected ? "bg-[#065f46]/[0.06]" : "hover:bg-[#e6ddd0]/40"}`}
                  >
                    <CoinIcon symbol={a.symbol} size={20} />
                    <span className="flex-1 font-bold text-[#17372d]">{a.symbol}</span>
                    <span className="w-20 text-right text-[12px] tabular-nums text-[#17372d]">
                      {formatPrice(a.markPx)}
                    </span>
                    <span
                      className={`w-16 text-right text-[11px] font-medium tabular-nums ${c.positive ? "text-[#065f46]" : "text-[#b42318]"}`}
                    >
                      {c.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
