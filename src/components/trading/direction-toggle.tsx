"use client";

import { ArrowDown, ArrowUp } from "@phosphor-icons/react";

type Direction = "long" | "short";

export function DirectionToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: Direction;
  onChange: (v: Direction) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="direction"
      className="grid h-10 grid-cols-2 overflow-hidden rounded-none border border-[#065f46]/15 bg-[#f5f2ed]"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "long"}
        disabled={disabled}
        onClick={() => onChange("long")}
        className={`group relative flex items-center justify-center gap-1.5 text-sm font-bold uppercase tracking-wide transition-all duration-200 disabled:cursor-not-allowed ${
          value === "long"
            ? "bg-[#065f46] text-white shadow-inner"
            : "text-[#547468] hover:bg-[#065f46]/10 hover:text-[#065f46]"
        }`}
      >
        <ArrowUp
          size={14}
          weight="bold"
          className={`transition-transform duration-200 ${value === "long" ? "translate-y-0" : "-translate-y-0.5"}`}
        />
        <span>long</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "short"}
        disabled={disabled}
        onClick={() => onChange("short")}
        className={`group relative flex items-center justify-center gap-1.5 border-l border-[#065f46]/15 text-sm font-bold uppercase tracking-wide transition-all duration-200 disabled:cursor-not-allowed ${
          value === "short"
            ? "bg-[#b42318] text-white shadow-inner"
            : "text-[#547468] hover:bg-[#b42318]/10 hover:text-[#b42318]"
        }`}
      >
        <ArrowDown
          size={14}
          weight="bold"
          className={`transition-transform duration-200 ${value === "short" ? "translate-y-0" : "translate-y-0.5"}`}
        />
        <span>short</span>
      </button>
    </div>
  );
}
