// Deterministic gradient avatar from a seed string. Same seed = same colors.
function avatarColors(seed: string): { from: string; to: string; angle: number } {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue1 = h % 360;
  const hue2 = (hue1 + 60 + (h >> 8) % 120) % 360;
  const angle = (h >> 16) % 180;
  return {
    from: `hsl(${hue1} 70% 55%)`,
    to: `hsl(${hue2} 70% 35%)`,
    angle,
  };
}

export function TokenArtwork({
  type,
  imageUrl,
}: {
  type: string;
  imageUrl?: string | null;
}) {
  const base =
    "relative flex h-full w-full items-center justify-center overflow-hidden border border-white/5";

  if (imageUrl) {
    return (
      <div className={`${base} rounded-[inherit] bg-[#2a2a2f]`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // Generated avatar fallback when no image was uploaded. Mode A launches
  // don't write SPL token-metadata, so cards routinely lack an imageUrl.
  // `type` is seeded from the symbol (or address slice) by tokenFromOnChain.
  if (type && type !== "render" && type !== "penguin" && type !== "jupiter" && type !== "raydium") {
    const c = avatarColors(type);
    const initials = type.replace(/[^A-Z0-9]/gi, "").slice(0, 2).toUpperCase() || "?";
    return (
      <div
        className={`${base} rounded-[inherit]`}
        style={{
          background: `linear-gradient(${c.angle}deg, ${c.from} 0%, ${c.to} 100%)`,
        }}
      >
        <span className="absolute inset-0 flex items-center justify-center text-5xl font-black tracking-tight text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          {initials}
        </span>
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.18),transparent_55%)]" />
      </div>
    );
  }

  if (type === "render") {
    return (
      <div className={`${base} rounded-[inherit] bg-[#2a2a2f] text-[#80808a]`}>
        <div className="text-4xl">&#9633;</div>
      </div>
    );
  }

  if (type === "penguin") {
    return (
      <div className={`${base} rounded-[inherit] bg-[#d7e6ef]`}>
        <div className="absolute bottom-[-22px] h-52 w-36 rounded-t-[70px] bg-[#7ea6f3]" />
        <div className="absolute bottom-[-10px] h-44 w-28 rounded-t-[60px] bg-[#f5f0e8]" />
        <div className="absolute right-16 top-10 size-7 rounded-full bg-white shadow-[0_0_0_3px_#111]">
          <div className="absolute left-[9px] top-[8px] size-3 rounded-full bg-[#09090c]" />
        </div>
        <div className="absolute right-7 top-10 size-7 rounded-full bg-white shadow-[0_0_0_3px_#111]">
          <div className="absolute left-[9px] top-[8px] size-3 rounded-full bg-[#09090c]" />
        </div>
        <div className="absolute top-20 h-4 w-8 rounded-full bg-[#f6a739]" />
      </div>
    );
  }

  if (type === "jupiter") {
    return (
      <div className={`${base} rounded-[inherit] bg-[#10192b]`}>
        <div className="absolute inset-x-10 top-0 h-48 rounded-full border-[14px] border-[#c2f56c] opacity-90" />
        <div className="absolute inset-x-6 top-5 h-48 rounded-full border-[14px] border-[#68e0cb] opacity-90" />
        <div className="absolute inset-x-0 top-10 h-48 rounded-full border-[14px] border-[#4fc6e4] opacity-90" />
      </div>
    );
  }

  if (type === "raydium") {
    return (
      <div className={`${base} rounded-[inherit] bg-[#141725]`}>
        <div className="absolute inset-y-0 left-8 w-4 bg-gradient-to-b from-[#46bff7] to-[#77f7d2]" />
        <div className="absolute left-24 top-8 h-6 w-24 bg-gradient-to-r from-[#3c8cff] to-[#6e39ff]" />
        <div className="absolute left-24 top-14 h-20 w-8 bg-gradient-to-b from-[#3c8cff] to-[#6e39ff]" />
        <div className="absolute left-32 top-14 h-8 w-24 rounded-r-full border-r-[18px] border-t-[18px] border-b-[18px] border-[#4c6fff] border-t-transparent border-b-transparent" />
        <div className="absolute right-10 top-8 size-6 rotate-45 bg-[#be15ff]" />
        <div className="absolute right-7 top-28 h-28 w-4 bg-[#be15ff]" />
      </div>
    );
  }

  if (type === "troll") {
    return (
      <div className={`${base} rounded-[inherit] bg-white text-black`}>
        <div className="rotate-[-7deg] text-[86px] font-black leading-none">
          :)
        </div>
      </div>
    );
  }

  if (type === "chips") {
    return (
      <div className={`${base} rounded-[inherit] bg-[#f3dfbf]`}>
        <div className="relative flex size-44 items-center justify-center rounded-full border-[5px] border-[#5d2d12] bg-[#f6b45c] shadow-[inset_0_0_0_8px_#d5842b]">
          <div className="flex h-24 w-20 items-center justify-center rounded-[18px] border-[5px] border-[#6c3811] bg-[#ffd079] text-4xl">
            <span>◕</span>
          </div>
        </div>
      </div>
    );
  }

  if (type === "robot") {
    return (
      <div
        className={`${base} rounded-[inherit] bg-[radial-gradient(circle_at_top,_#1f6f3a_0,_#06190f_65%)]`}
      >
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#62ff8d_1px,transparent_1px),linear-gradient(90deg,#62ff8d_1px,transparent_1px)] [background-size:14px_14px]" />
        <div className="absolute top-10 size-28 rounded-[40px] bg-white shadow-[0_0_0_4px_#96e4ab]">
          <div className="absolute left-6 top-11 size-4 rounded-full bg-[#384f49]" />
          <div className="absolute right-6 top-11 size-4 rounded-full bg-[#384f49]" />
          <div className="absolute left-1/2 top-16 h-1 w-8 -translate-x-1/2 bg-[#384f49]" />
        </div>
        <div className="absolute bottom-0 h-32 w-40 rounded-t-[26px] bg-[#80e094] shadow-[0_0_0_4px_#d9ffe1]" />
      </div>
    );
  }

  if (type === "kitty") {
    return (
      <div className={`${base} rounded-[inherit] bg-[#ebe7df]`}>
        <div className="absolute bottom-[-24px] h-48 w-40 rounded-t-[72px] bg-[#b08f72]" />
        <div className="absolute left-1/2 top-14 h-16 w-28 -translate-x-1/2 rounded-full bg-[#9b1c19]" />
      </div>
    );
  }

  if (type === "airdrop") {
    return (
      <div
        className={`${base} rounded-[inherit] bg-[radial-gradient(circle_at_center,_#2aa3ff_0,_#0a1024_70%)] text-white`}
      >
        <div className="text-center font-black leading-none">
          <div className="text-7xl">⌂</div>
          <div className="text-4xl">Airdrop</div>
        </div>
      </div>
    );
  }

  if (type === "mark") {
    return (
      <div className={`${base} rounded-[inherit] bg-[#f4f4f4] text-black`}>
        <div className="text-[110px] font-black tracking-[-0.12em]">M</div>
      </div>
    );
  }

  if (type === "nak4") {
    return (
      <div className={`${base} rounded-[inherit] bg-[#08080b] text-white`}>
        <div className="text-6xl font-black tracking-tight">NAK4</div>
      </div>
    );
  }

  if (type === "mono") {
    return (
      <div className={`${base} rounded-[inherit] bg-[#d8d8d8] text-black`}>
        <div className="text-[110px] font-black">M</div>
      </div>
    );
  }

  if (type === "molt") {
    return (
      <div className={`${base} rounded-[inherit] bg-[#2a0700] text-[#ff8a31]`}>
        <div className="absolute top-1 text-[10px] font-bold tracking-[0.4em]">
          MOLT.ID
        </div>
      </div>
    );
  }

  if (type === "mountain") {
    return (
      <div
        className={`${base} rounded-[inherit] bg-[linear-gradient(180deg,#d7d7d7_0%,#7d7d7d_50%,#111_100%)]`}
      />
    );
  }

  if (type === "block") {
    return (
      <div className={`${base} rounded-[inherit] bg-black`}>
        <div className="h-10 w-32 rounded-r-full bg-white" />
      </div>
    );
  }

  return <div className={`${base} rounded-[inherit] bg-[#2b2b31]`} />;
}
