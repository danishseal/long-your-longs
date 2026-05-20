"use client";

import { X } from "@phosphor-icons/react/dist/ssr";
import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HowItWorksModal({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="howitworks-title"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative w-full max-w-[560px] rounded-2xl border border-[#065f46]/15 bg-[#fffaf3] p-6 shadow-2xl md:p-8">
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex size-8 items-center justify-center rounded-full text-[#647067] transition-colors hover:bg-[#e6ddd0]/60 hover:text-[#17372d]"
        >
          <X size={16} />
        </button>

        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6f857c]">
          how it works
        </div>
        <h2
          id="howitworks-title"
          className="mt-2 text-3xl font-bold tracking-tight text-[#17372d] md:text-4xl"
        >
          Buy. Hold. The perp follows.
        </h2>

        <ol className="mt-6 space-y-5">
          {[
            {
              n: 1,
              tone: "bg-[#065f46] text-white",
              label: "Pick a token, buy with SOL.",
              body:
                "Every launch is paired with a leveraged Hyperliquid perpetual. Your SOL bridges to USDC and opens a proportional perp position in ~30 to 60 seconds.",
            },
            {
              n: 2,
              tone: "bg-[#17372d] text-white",
              label: "Token NAV tracks the perp.",
              body:
                "When the underlying market moves, the curve owns more or less USD. The price you can sell back at moves with it. No graduation, no migration.",
            },
            {
              n: 3,
              tone: "bg-[#18dd73] text-[#17372d]",
              label: "Sell anytime, perp closes.",
              body:
                "Click sell. The curve refunds you SOL minus a 1% fee, and the perp shrinks proportionally on Hyperliquid. The position stays open as long as anyone holds the token.",
            },
          ].map((step) => (
            <li key={step.n} className="flex gap-4">
              <div
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${step.tone}`}
              >
                {step.n}
              </div>
              <div className="space-y-1 pt-0.5">
                <p className="text-[14px] font-bold text-[#17372d]">{step.label}</p>
                <p className="text-[13px] leading-relaxed text-[#3b4a44]">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-xl bg-[#e6ddd0]/60 px-4 py-3 text-[13px] leading-relaxed text-[#3b4a44]">
          <span className="font-bold text-[#17372d]">Heads up.</span>{" "}
          Token NAV moves with the perp times leverage. Default leverage is 3x. If the perp gets liquidated,
          the curve&apos;s backing shrinks. Pick directions and amounts you can sit with.
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[13px] font-medium text-[#065f46] underline decoration-dotted underline-offset-4 hover:text-[#054c38]"
          >
            Full technical docs
          </a>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-[#17372d] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0e2419] md:w-auto"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
