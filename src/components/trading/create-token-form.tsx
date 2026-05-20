"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, UploadSimple } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { BN } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAltsolProgram } from "@/lib/altsol/program";
import { TOKENS_QUERY_KEY } from "@/hooks/use-tokens";
import { TOKEN_DETAIL_QUERY_KEY } from "@/hooks/use-token-detail";
import { PerpPicker } from "@/components/trading/perp-picker";
import { DirectionToggle } from "@/components/trading/direction-toggle";
import type { TokenListItem } from "@/lib/api";

const formSchema = z.object({
  mode: z.enum(["a", "b"]),
  name: z.string().min(1, "Name is required").max(32, "Max 32 characters"),
  symbol: z.string().min(1, "Ticker is required").max(10, "Max 10 characters"),
  image: z.string().optional(),
  description: z.string().max(500, "Max 500 characters").optional(),
  socialLinks: z.string().optional(),
  perpAsset: z.coerce.number().int().min(0).max(2000),
  direction: z.enum(["long", "short"]),
  leverageBps: z.coerce.number().int().min(10_000).max(30_000),
});

type FormValues = z.input<typeof formSchema>;

export function CreateTokenForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const queryClient = useQueryClient();
  const program = useAltsolProgram();
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "a",
      name: "",
      symbol: "",
      image: "",
      description: "",
      socialLinks: "",
      perpAsset: 0,
      direction: "long",
      leverageBps: 30_000,
    },
  });
  const mode = form.watch("mode");

  const imageValue = form.watch("image");
  const descriptionValue = form.watch("description");
  const descriptionLength = (descriptionValue ?? "").length;

  async function handleImageUpload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    setIsUploadingImage(true);
    toast.loading("Uploading image...", { id: "token-image-upload" });
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();
      if (!response.ok || !result.url)
        throw new Error(result.error ?? "Upload failed");
      form.setValue("image", result.url, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      toast.success("Image uploaded", { id: "token-image-upload" });
    } catch (error) {
      toast.error("Image upload failed", {
        id: "token-image-upload",
        description: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setIsUploadingImage(false);
    }
  }

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!program || !publicKey) throw new Error("Wallet not connected");
      if (values.mode === "b") return runPumpLaunch(program, publicKey, values);
      return runPerpLaunch(program, publicKey, values);
    },
    onMutate: () => toast.loading("Submitting launch...", { id: "create-token" }),
    onSuccess: (result, values) => {
      toast.success("Launch created", {
        id: "create-token",
        description: `${result.mint.slice(0, 8)}... sig ${result.signature.slice(0, 8)}...`,
        action: {
          label: "view tx",
          onClick: () =>
            window.open(`https://solscan.io/tx/${result.signature}`, "_blank", "noopener"),
        },
        duration: 10_000,
      });
      // Prefill the detail cache so /token/[mint] renders immediately,
      // without waiting for RPC replicas to propagate the new account.
      const stub: TokenListItem = {
        address: result.mint,
        name: values.name,
        symbol: values.symbol,
        image: values.image || null,
        description: values.description ?? null,
        creator: publicKey?.toBase58() ?? null,
        source: values.mode === "b" ? "pump" : "perp",
        graduated: false,
        created_at: new Date().toISOString(),
        first_seen_at: new Date().toISOString(),
        created_height: null,
        current_price: "0",
        reserves: "0",
        volume_24h: "0",
        trade_count_24h: 0,
        total_minted: "0",
        total_supply: "1000000000000000000",
        real_sol_reserves: "0",
        fee_bps: 100,
        perp_asset: Number(values.perpAsset),
        leverage_bps: Number(values.leverageBps),
        direction: values.direction,
      };
      queryClient.setQueryData(TOKEN_DETAIL_QUERY_KEY(result.mint), stub);
      // Persist by-mint locally so home grid + detail page can render the
      // user-supplied name/symbol/image even before on-chain metadata is
      // indexed (Mode A has no SPL token-metadata at all; Mode B's metadata
      // takes time to propagate).
      if (typeof window !== "undefined") {
        try {
          if (values.image) {
            const rawI = window.localStorage.getItem("lyl_token_images") ?? "{}";
            const mapI = JSON.parse(rawI) as Record<string, string>;
            mapI[result.mint] = values.image;
            window.localStorage.setItem("lyl_token_images", JSON.stringify(mapI));
          }
          const rawS = window.localStorage.getItem("lyl_token_stubs") ?? "{}";
          const mapS = JSON.parse(rawS) as Record<string, typeof stub>;
          mapS[result.mint] = stub;
          window.localStorage.setItem("lyl_token_stubs", JSON.stringify(mapS));
        } catch {}
      }
      // Also persist to server-side metadata store so the launch shows up
      // with its real name/symbol/image for any visitor (not just the
      // creator's browser).
      fetch(`/api/metadata/${result.mint}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          symbol: values.symbol,
          description: values.description ?? "",
          image: values.image ?? "",
          creator: publicKey?.toBase58() ?? "",
          createdAt: Math.floor(Date.now() / 1000),
        }),
      }).catch(() => {});
      queryClient.invalidateQueries({ queryKey: TOKENS_QUERY_KEY });
      router.push(`/token/${result.mint}`);
    },
    onError: (error) => {
      toast.error("Launch failed", {
        id: "create-token",
        description: error instanceof Error ? error.message : "Unknown",
      });
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="overflow-hidden border border-[#065f46]/15 bg-[#fffaf3] px-4 py-4 shadow-sm sm:px-5 sm:py-5"
      >
        <div className="space-y-2.5">
          <div className="space-y-1">
            <h2 className="text-[1.35rem] font-bold tracking-tight text-[#17372d]">
              [start a new coin]
            </h2>
            <p className="text-xs text-[#6f857c] sm:text-sm">
              choose how the launch is backed
            </p>
          </div>

          {/* Mode A vs Mode B */}
          <FormField
            control={form.control}
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-[#17372d]">launch mode</FormLabel>
                <FormControl>
                  <div className="grid gap-2 md:grid-cols-2">
                    {([
                      {
                        id: "a" as const,
                        tag: "Mode A",
                        title: "perp-backed direct",
                        desc: "Our SPL on a bonding curve. Every trade adjusts the perp immediately.",
                      },
                      {
                        id: "b" as const,
                        tag: "Mode B",
                        title: "pump.fun creator fees",
                        desc: "Token lives on pump.fun. 100% of creator fees fund the perp position.",
                      },
                    ]).map((opt) => {
                      const selected = field.value === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => field.onChange(opt.id)}
                          aria-pressed={selected}
                          className={cn(
                            "relative flex flex-col items-start gap-1 rounded-md border px-3.5 py-3 text-left transition-all",
                            selected
                              ? "border-[#065f46] bg-[#065f46]/[0.06] ring-2 ring-[#065f46]/15"
                              : "border-[#065f46]/15 bg-[#f5f2ed] hover:border-[#065f46]/40 hover:bg-[#e6ddd0]/40",
                          )}
                        >
                          <span
                            className={cn(
                              "absolute right-2.5 top-2.5 flex size-4 items-center justify-center rounded-full border transition-colors",
                              selected
                                ? "border-[#065f46] bg-[#065f46] text-white"
                                : "border-[#065f46]/30 bg-transparent",
                            )}
                          >
                            {selected ? <Check size={10} weight="bold" /> : null}
                          </span>
                          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6f857c]">{opt.tag}</span>
                          <span className="text-sm font-bold text-[#17372d]">{opt.title}</span>
                          <span className="text-[11px] leading-snug text-[#6f857c]">{opt.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-2 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-[#17372d]">
                    name
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="My Awesome Token"
                      disabled={mutation.isPending}
                      className="h-10 rounded-none border border-[#065f46]/15 bg-[#f5f2ed] px-4 text-sm text-[#17372d] placeholder:text-[#6f857c] focus-visible:ring-[#065f46]/20"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-[#6f857c]">
                    Full name (max 32 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-[#17372d]">
                    ticker
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="MAT"
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                      disabled={mutation.isPending}
                      className="h-10 rounded-none border border-[#065f46]/15 bg-[#f5f2ed] px-4 text-sm text-[#17372d] placeholder:text-[#6f857c] focus-visible:ring-[#065f46]/20"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-[#6f857c]">
                    Uppercase letters and numbers (max 10)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="image"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-[#17372d]">
                  image
                </FormLabel>
                <FormControl>
                  <div className="space-y-0">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageUpload(f);
                        e.target.value = "";
                      }}
                    />
                    <div
                      role="button"
                      tabIndex={0}
                      aria-disabled={mutation.isPending || isUploadingImage}
                      onClick={() => {
                        if (mutation.isPending || isUploadingImage) return;
                        fileInputRef.current?.click();
                      }}
                      onKeyDown={(e) => {
                        if (mutation.isPending || isUploadingImage) return;
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!mutation.isPending && !isUploadingImage) setIsDragging(true);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
                        if (!mutation.isPending && !isUploadingImage) setIsDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDragging(false);
                        if (mutation.isPending || isUploadingImage) return;
                        const f = e.dataTransfer.files?.[0];
                        if (!f) return;
                        if (!f.type.startsWith("image/")) {
                          toast.error("Only image files are accepted");
                          return;
                        }
                        handleImageUpload(f);
                      }}
                      className={cn(
                        "flex min-h-[112px] w-full cursor-pointer flex-col items-center justify-center border border-dashed border-[#065f46]/20 bg-[#f5f2ed] px-4 py-3.5 text-center transition-colors hover:border-[#065f46]/50 hover:bg-[#e6ddd0]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#065f46]/30 aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
                        imageValue && "border-solid",
                        isDragging && "border-[#065f46] bg-[#e6ddd0]/60",
                      )}
                    >
                      {imageValue ? (
                        <div className="space-y-2">
                          <div className="mx-auto flex h-11 w-11 items-center justify-center overflow-hidden bg-[#e6ddd0] shadow-sm">
                            {/* biome-ignore lint/performance/noImgElement: dynamic upload preview */}
                            <img
                              src={imageValue}
                              alt="Token preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-[#17372d]">
                              {isUploadingImage
                                ? "Uploading..."
                                : "Click to replace"}
                            </p>
                            <p className="text-xs text-[#6f857c]">
                              PNG, JPG, GIF, WebP, SVG (max 2MB)
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="mx-auto flex h-8 w-8 items-center justify-center bg-[#065f46] text-white">
                            <UploadSimple size={18} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-[#17372d]">
                              {isUploadingImage
                                ? "Uploading..."
                                : isDragging
                                  ? "Drop to upload"
                                  : "Drop Image here or click to browse"}
                            </p>
                            <p className="text-xs text-[#6f857c]">
                              PNG, JPG, GIF, WebP, SVG (max 2MB)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <input
                      type="hidden"
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-[#17372d]">
                  description (optional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Describe what makes your token unique..."
                    rows={4}
                    disabled={mutation.isPending}
                    className="min-h-[64px] rounded-none border border-[#065f46]/15 bg-[#f5f2ed] px-4 py-2 text-sm text-[#17372d] placeholder:text-[#6f857c] focus-visible:ring-[#065f46]/20"
                  />
                </FormControl>
                <FormDescription className="text-xs text-[#6f857c]">
                  Up to 500 characters describing your token
                </FormDescription>
                <div className="flex items-center justify-between gap-3">
                  <FormMessage />
                  <span className="text-xs text-[#6f857c]">
                    {descriptionLength}/500
                  </span>
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialLinks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-bold text-[#17372d]">
                  social links (optional)
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="https://twitter.com/..., https://discord.gg/..."
                    disabled={mutation.isPending}
                    className="h-9 rounded-none border border-[#065f46]/15 bg-[#f5f2ed] px-4 text-sm text-[#17372d] placeholder:text-[#6f857c] focus-visible:ring-[#065f46]/20"
                  />
                </FormControl>
                <FormDescription className="text-xs text-[#6f857c]">
                  Comma-separated URLs for your community channels
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-3 md:grid-cols-3">
            <FormField
              control={form.control}
              name="perpAsset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-[#17372d]">perp</FormLabel>
                  <FormControl>
                    <PerpPicker
                      value={Number(field.value)}
                      onChange={(idx) => field.onChange(idx)}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-[#6f857c]">
                    live Hyperliquid mark price
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="direction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-bold text-[#17372d]">direction</FormLabel>
                  <FormControl>
                    <DirectionToggle
                      value={field.value as "long" | "short"}
                      onChange={(v) => field.onChange(v)}
                      disabled={mutation.isPending}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-[#6f857c]">side of the perp</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="leverageBps"
              render={({ field }) => {
                const bps = Number(field.value) || 10_000;
                const x = bps / 10_000;
                const disabled = mutation.isPending || mode === "b";
                return (
                  <FormItem className={mode === "b" ? "opacity-50" : ""}>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-bold text-[#17372d]">leverage</FormLabel>
                      <span className="text-sm font-bold tabular-nums text-[#065f46]">
                        {x.toFixed(1)}x
                      </span>
                    </div>
                    <FormControl>
                      <input
                        type="range"
                        min={10_000}
                        max={30_000}
                        step={1_000}
                        value={bps}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={disabled}
                        className="h-10 w-full cursor-pointer appearance-none bg-transparent accent-[#065f46] disabled:cursor-not-allowed [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[#065f46]/15 [&::-webkit-slider-thumb]:mt-[-7px] [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#065f46] [&::-webkit-slider-thumb]:shadow"
                      />
                    </FormControl>
                    <div className="flex justify-between text-[10px] font-medium tracking-wide text-[#6f857c]">
                      <span>1x</span>
                      <span>2x</span>
                      <span>3x</span>
                    </div>
                    <FormDescription className="text-xs text-[#6f857c]">
                      {mode === "b" ? "set by fee inflow" : "3x protocol cap"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          </div>

          <div className="grid gap-0 overflow-hidden border border-[#065f46]/15 md:grid-cols-[1fr_1.15fr]">
            <div className="bg-[#f5f2ed] px-4 py-2.5">
              <p className="text-sm font-bold text-[#17372d]">
                {mode === "b"
                  ? "deploys a pump.fun coin + harvests creator fees"
                  : "deploys your coin + opens a leveraged perp"}
              </p>
              <p className="mt-1 text-xs text-[#6f857c]">
                {mode === "b"
                  ? "Token lives on pump.fun. 100% of creator fees auto-bridge to the Hyperliquid perp."
                  : "Every buy mints shares and adds to the perp position. 1% fee to ops."}
              </p>
            </div>
            <Button
              type="submit"
              className="h-full min-h-12 rounded-none border-0 bg-[#065f46] px-6 text-sm font-bold text-white hover:bg-[#054c38] md:border-l md:border-[#065f46]/15"
              disabled={mutation.isPending || isUploadingImage || !publicKey}
            >
              {!publicKey ? "connect wallet" : mutation.isPending ? "creating..." : "create"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}

async function runPerpLaunch(
  program: NonNullable<ReturnType<typeof useAltsolProgram>>,
  creator: PublicKey,
  values: FormValues,
) {
  const mintKp = Keypair.generate();
  const mint = mintKp.publicKey;
  const sig = await program.methods
    .initLaunch({
      name: values.name,
      symbol: values.symbol,
      hyperliquidPerpAsset: values.perpAsset,
      feeBps: 100, // 1%
      graduationThresholdLamports: new BN(100_000_000_000),
      leverageBps: values.leverageBps,
      direction: values.direction === "long" ? { long: {} } : { short: {} },
    } as never)
    .accounts({
      creator,
      mint,
      quoteMint: NATIVE_MINT,
    } as never)
    .signers([mintKp])
    .rpc({ commitment: "confirmed" });
  return { mint: mint.toBase58(), signature: sig };
}

async function runPumpLaunch(
  program: NonNullable<ReturnType<typeof useAltsolProgram>>,
  creator: PublicKey,
  values: FormValues,
) {
  const { Transaction } = await import("@solana/web3.js");
  const { buildPumpCreateIx } = await import("@/lib/altsol/pumpfun-create");
  const { findPumpLaunchPda, findPumpAuthorityPda } = await import("@/lib/altsol/constants");

  const mintKp = Keypair.generate();
  const pumpMint = mintKp.publicKey;
  const [pumpLaunch] = findPumpLaunchPda(pumpMint);
  const [launchAuthority] = findPumpAuthorityPda(pumpLaunch);

  const connection = program.provider.connection;
  const pumpCreateIx = await buildPumpCreateIx(connection, creator, pumpMint, {
    name: values.name,
    symbol: values.symbol,
    uri: values.image ?? "",
    creator: launchAuthority,
  });

  const registerIx = await program.methods
    .initPumpLaunch({
      referencePerpMarketIndex: values.perpAsset,
      direction: values.direction === "long" ? { long: {} } : { short: {} },
    } as never)
    .accounts({
      creator,
      pumpMint,
    } as never)
    .instruction();

  const tx = new Transaction().add(pumpCreateIx).add(registerIx);
  const sig = await program.provider.sendAndConfirm!(tx, [mintKp], {
    commitment: "confirmed",
  });
  return { mint: pumpMint.toBase58(), signature: sig };
}
