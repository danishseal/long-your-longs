import type { Metadata } from "next";
import Link from "next/link";
import AppShell from "../components/app-shell";

export const metadata: Metadata = {
  title: "Docs · Long Your Longs",
  description: "How perp-backed launches work. Concepts, mechanics, and on-chain proofs.",
};

const SOLANA_PROGRAM = "C1q8mGfr8a5rfPbaCJ1mGpocsDJc1xXZxbX1adLAX4r9";
const HYPEREVM_MANAGER_V9 = "0x1ddf514644fc66492d39fcb6a452cdcb2a5bf3d5";
const CRANKER_SOL = "5BYyHQHe8CMcAMJogQpz2c9wukSSAZdhrsdnvSFwTVVx";
const CRANKER_EVM = "0xaEDA0466b386EEa67a16238e2E8d3Caf38acb643";
const HYPEREVM_USDC = "0xb88339CB7199b77E23DB6E890353E22632Ba630f";
const CORE_DEPOSIT_WALLET = "0x6B9E773128f453f5c2C60935Ee2DE2CBc5390A24";
const CORE_WRITER = "0x3333333333333333333333333333333333333333";
const USDC_SYSTEM_ADDR = "0x2000000000000000000000000000000000000000";

const TX_PROGRAM_UPGRADE = "pYEWrCu7JjiR5HhQz1YNsnNDaj4FZjfQajjLzRsGZzMXdTCJTZTuVFGeAMEjkQ4rBWMckf7Ub7eJUNKDKBy685N";
const TX_V9_ADDAPI = "0x0a38108ad74428380e1151997fc093ef80773f2c9da865935a9fdda79423545f";
const TX_V9_PUSHUSDC = "0xa099fe8762624aaf432713d78b73a64dbfcf20ccd62cde5c014bf49e4d311ad3";
const TX_MODEB_LAUNCH = "5pA9Xf4CrJfPbKaAod3PyQ29aydPeCrbg9jMGo4YDiuCuJK4uULzThfV7Rwd7PgdMCjCsdjryC7fB31mcFHMMFCv";
const TX_PHASE1_LIVE = "0x1a94d2767cc3f73f0ea23e3113564465b8a8ae4e3fd6c67e3c29d0c7a3c14611";
const TX_REBALANCE_BRIDGE = "0xcb2d48c1d61d8b93912ecd0c9f44e3168f8f9238667b60872bb1233ddf200270";
const TX_V9_BUY_FILL = "0xf803fa839a45cc4ad51c063f2c7450e3ddac5f56e73a7527b7b7b5ee162683e4";
const TEST_MINT = "6e3NiF4ZKAaqebhiz3jeYqtYXz47r8BqrvvKhjec2q38";
const LLP_MINT = "Dx6XfGFKWgm6begrwwvx6ntmzfkptnBos5FsvqFKBApq";

const NAV: Array<{ group: string; items: Array<{ id: string; label: string }> }> = [
  {
    group: "Getting Started",
    items: [
      { id: "what", label: "What is LYL" },
      { id: "tldr", label: "TL;DR for traders" },
      { id: "tldr-creators", label: "TL;DR for creators" },
    ],
  },
  {
    group: "How it works",
    items: [
      { id: "concept", label: "The core idea" },
      { id: "trader", label: "Trader experience" },
      { id: "creator", label: "Creator experience" },
      { id: "perp-forever", label: "Perp forever model" },
      { id: "two-modes", label: "Mode A vs Mode B" },
    ],
  },
  {
    group: "Mechanics",
    items: [
      { id: "architecture", label: "Architecture" },
      { id: "curve", label: "Bonding curve math" },
      { id: "fees", label: "Fee model" },
      { id: "bridge", label: "Bridge crank" },
      { id: "manager", label: "Perp manager" },
      { id: "rebalance", label: "Rebalance loop" },
    ],
  },
  {
    group: "Reference",
    items: [
      { id: "addresses", label: "Addresses" },
      { id: "proofs", label: "On-chain proofs" },
      { id: "risk", label: "Risk and limitations" },
      { id: "faq", label: "FAQ" },
    ],
  },
];

function Sol({ children, kind = "account" }: { children: string; kind?: "account" | "tx" }) {
  const path = kind === "tx" ? "tx" : "account";
  return (
    <a
      href={`https://solscan.io/${path}/${children}`}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all font-mono text-[12px] text-[#065f46] underline decoration-dotted underline-offset-2 hover:text-[#054c38]"
    >
      {children}
    </a>
  );
}

function Hl({ children, kind = "address" }: { children: string; kind?: "address" | "tx" }) {
  const path = kind === "tx" ? "tx" : "address";
  return (
    <a
      href={`https://hyperevmscan.io/${path}/${children}`}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all font-mono text-[12px] text-[#065f46] underline decoration-dotted underline-offset-2 hover:text-[#054c38]"
    >
      {children}
    </a>
  );
}

function HlPos({ children }: { children: string }) {
  return (
    <a
      href={`https://app.hyperliquid.xyz/explorer/address/${children}`}
      target="_blank"
      rel="noopener noreferrer"
      className="break-all font-mono text-[12px] text-[#065f46] underline decoration-dotted underline-offset-2 hover:text-[#054c38]"
    >
      {children}
    </a>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return <code className="rounded bg-[#e6ddd0]/50 px-1.5 py-0.5 font-mono text-[12px] text-[#17372d]">{children}</code>;
}

function Section({ id, title, num, children }: { id: string; title: string; num?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4 border-t border-[#065f46]/12 pt-10">
      <h2 className="text-2xl font-bold tracking-tight text-[#17372d]">
        {num ? <span className="mr-2 text-[#6f857c]">{num}</span> : null}
        {title}
      </h2>
      <div className="space-y-4 text-[14px] leading-[1.7] text-[#3b4a44]">{children}</div>
    </section>
  );
}

function Callout({ kind = "info", children }: { kind?: "info" | "warn"; children: React.ReactNode }) {
  const tone = kind === "warn"
    ? "border-[#f0b90b]/40 bg-[#fff7d6]"
    : "border-[#065f46]/20 bg-[#e6ddd0]/40";
  return (
    <div className={`rounded-md border ${tone} px-4 py-3 text-[13px] leading-relaxed text-[#3b4a44]`}>
      {children}
    </div>
  );
}

function KV({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-1 border-b border-dashed border-[#065f46]/15 py-2 md:grid-cols-[200px_1fr] md:gap-6">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6f857c]">{k}</div>
      <div className="text-[13px] text-[#17372d]">{v}</div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <AppShell showTicker={false}>
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-10 md:px-8">
        {/* Left sidebar nav */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-auto pr-2">
            <nav className="space-y-6 text-[13px]">
              {NAV.map((group) => (
                <div key={group.group}>
                  <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6f857c]">
                    {group.group}
                  </div>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={item.id}>
                        <Link
                          href={`#${item.id}`}
                          className="block rounded-sm px-2 py-1 text-[#3b4a44] hover:bg-[#e6ddd0]/70 hover:text-[#065f46]"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 space-y-6">
          <header className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-widest text-[#6f857c]">long your longs</div>
            <h1 className="text-4xl font-bold tracking-tight text-[#17372d] md:text-5xl">Documentation</h1>
            <p className="text-[15px] leading-relaxed text-[#647067] md:text-base">
              A launchpad where every memecoin is paired with a leveraged perpetual on Hyperliquid.
              When the perp moves, the token moves. When you buy the token, the perp grows.
              When you sell, it shrinks. The perp lives forever, the curve lives forever.
            </p>
            <p className="text-[13px] text-[#6f857c]">
              Every claim on this page is verifiable. All addresses, contracts, and transactions link to public block explorers.
            </p>
          </header>

          <Section id="what" num="0" title="What is Long Your Longs">
            <p>
              Long Your Longs is a memecoin launchpad on Solana. Every token launched here has two layers running in parallel:
            </p>
            <ol className="ml-6 list-decimal space-y-2">
              <li>
                A standard bonding curve on Solana. Buy SOL into the curve, get tokens. Sell tokens, get SOL back.
                Identical mechanic to pump.fun if you have used it before.
              </li>
              <li>
                A leveraged perpetual position on Hyperliquid that grows and shrinks in lockstep with the curve.
                You pick the asset (BTC, ETH, SOL, anything Hyperliquid lists), the direction (long or short), and the leverage (up to 3x).
              </li>
            </ol>
            <p>
              Result: the token's economic backing is not "vibes" or "creator credibility". It is a live, mark-to-market position
              that anyone can verify on Hyperliquid&apos;s public block explorer. If you launch a 3x long BTC token and BTC pumps,
              your token&apos;s NAV pumps. If BTC dumps, your token&apos;s NAV dumps.
            </p>
            <Callout>
              The phrase &quot;perp forever&quot; means there is no graduation event, no Raydium migration, no PvP rugpull moment.
              The curve runs forever and the perp runs forever, growing and shrinking with every trade.
            </Callout>
          </Section>

          <Section id="tldr" num="0.1" title="TL;DR for traders">
            <ul className="ml-6 list-disc space-y-2">
              <li>Find a token on the home page. Connect Phantom or Solflare.</li>
              <li>Buy with SOL. Minimum 0.15 SOL per buy (below that the bridge fees eat too much).</li>
              <li>Your buy mints tokens on the curve and bridges ~99% of your SOL (1% fee) to Hyperliquid, which opens a proportional perp position.</li>
              <li>Watch the chart. Token price tracks the underlying perp.</li>
              <li>Sell anytime. You receive SOL minus a 1% fee. The perp shrinks proportionally.</li>
            </ul>
          </Section>

          <Section id="tldr-creators" num="0.2" title="TL;DR for creators">
            <ul className="ml-6 list-disc space-y-2">
              <li>Click <Link href="/create" className="text-[#065f46] underline">Launch Token</Link>.</li>
              <li>Pick a name, ticker, the perp to back (BTC, ETH, SOL, etc.), direction, and leverage (1x, 2x, 3x).</li>
              <li>Approve the transaction. You pay only Solana rent, around 0.005 SOL.</li>
              <li>Your launch goes live immediately on the home page.</li>
              <li>You earn nothing directly. The 1% curve fee funds operations (bridge costs, gas, slippage).</li>
            </ul>
          </Section>

          <Section id="concept" num="1" title="The core idea">
            <p>
              Most memecoin launchpads pair the token with nothing real. Liquidity is sentiment.
              Once attention fades, the token round-trips to zero.
            </p>
            <p>
              Long Your Longs pairs the token with a position on a real perpetual market.
              That position is liquid, marked to market every second, and visible on a public order book run by a real exchange.
              You can argue with vibes. You cannot argue with a fill price.
            </p>
            <p>
              The product is a thin wrapper around three things that already exist and work:
            </p>
            <ol className="ml-6 list-decimal space-y-1">
              <li>Solana for the token, because it is fast and cheap.</li>
              <li>Hyperliquid for the perp, because it has the deepest non-CEX perp orderbook in crypto.</li>
              <li>deBridge DLN for the cross-chain glue, because it works at small sizes without trust assumptions.</li>
            </ol>
            <p>
              Everything else in this document explains how these three pieces fit together.
            </p>
          </Section>

          <Section id="trader" num="2" title="Trader experience">
            <p>
              From a trader perspective the experience looks like buying any pump.fun coin, with two differences.
            </p>
            <p>
              <strong>First difference: the chart shows the underlying perp.</strong> The token&apos;s NAV is mechanically tied to the perp&apos;s mark.
              If you launch a 3x long BTC token at BTC mark $77,000 and BTC moves to $80,000, the curve owns more USD than it started with (3 times the move),
              and you can sell back for proportionally more SOL.
            </p>
            <p>
              <strong>Second difference: the curve never graduates.</strong> Pump.fun-style launches eventually migrate to Raydium and lose the curve mechanic.
              We never do that. The curve is permanent. The perp runs forever.
            </p>
            <p>
              <strong>What actually happens when you click buy:</strong>
            </p>
            <ol className="ml-6 list-decimal space-y-1">
              <li>Your wallet signs one Solana transaction. Tokens land in your wallet in under a second.</li>
              <li>A backend daemon (the bridge crank) observes the buy event on Solana and ships USDC to Hyperliquid.</li>
              <li>The perp manager contract on Hyperliquid opens a proportional perp position. Typical end-to-end latency: 30 to 60 seconds.</li>
            </ol>
            <p>
              While the bridge is in flight you already hold the tokens. The perp settling does not block your trade.
            </p>
          </Section>

          <Section id="creator" num="3" title="Creator experience">
            <p>
              Launching a token is a single Solana transaction. You pick:
            </p>
            <ul className="ml-6 list-disc space-y-1">
              <li><strong>Name and ticker.</strong> Just metadata. Anything memorable.</li>
              <li><strong>Perp asset.</strong> The Hyperliquid market your token tracks. BTC is the default. Anything Hyperliquid lists works.</li>
              <li><strong>Direction.</strong> Long or short. Long bets the asset goes up. Short bets it goes down.</li>
              <li><strong>Leverage.</strong> 1x, 2x, or 3x. Capped at 3x for safety.</li>
            </ul>
            <p>
              You do not need to seed liquidity. The bonding curve starts with virtual reserves; the first buyer is the first real liquidity.
              You do not earn anything from the launch directly. The protocol takes 1% from every trade and uses it to fund bridge fees, gas, and rebalance slippage.
              No tokens are reserved for the creator. There is no team allocation.
            </p>
            <Callout kind="warn">
              The perp position is mechanically tied to the curve. If you launch a 3x short PUMP token and PUMP pumps, the perp goes deeply red,
              the curve&apos;s USD backing shrinks, and your token NAV drops. Pick directions thoughtfully.
            </Callout>
          </Section>

          <Section id="perp-forever" num="4" title="Perp forever model">
            <p>
              Traditional memecoin curves graduate. After a certain SOL threshold, the curve dies and liquidity migrates to a constant-product AMM.
              We never do that. Three reasons:
            </p>
            <ol className="ml-6 list-decimal space-y-2">
              <li>
                <strong>Graduation breaks the perp link.</strong> Once liquidity is on Raydium, our backend has no way to observe trades and adjust the perp.
                The token would drift away from the perp it was supposed to be backed by.
              </li>
              <li>
                <strong>The curve is good liquidity.</strong> A constant-product curve gives predictable slippage and unlimited depth at the extremes.
                There is no reason to migrate.
              </li>
              <li>
                <strong>It is the only way to keep the promise.</strong> If we tell traders "this token tracks a 3x BTC long forever",
                then we cannot turn off the mechanism halfway.
              </li>
            </ol>
            <p>
              So: the curve is permanent, the perp is permanent, and the only way the token dies is if the underlying asset goes to zero (a real perp event).
            </p>
          </Section>

          <Section id="two-modes" num="5" title="Mode A vs Mode B">
            <p>
              There are two ways to launch. Most launches use Mode A. Mode B is for creators who want the pump.fun audience.
            </p>
            <p>
              <strong>Mode A (perp-backed direct).</strong> The token is a synthetic SPL minted by our Solana program.
              The bonding curve operates on our program. Every buy and sell flows through us. Every trade triggers a proportional perp adjustment on Hyperliquid.
              This is the default in the launch form.
            </p>
            <p>
              <strong>Mode B (pump.fun-routed).</strong> The token is a real pump.fun token. The launch transaction creates the pump.fun token in the same transaction as our PumpLaunch registration,
              with our PDA registered as the pump.fun creator. Users trade the token on pump.fun. Pump.fun pays 5 basis points of every trade as creator fees to the registered creator (our PDA).
              Our harvester bot claims those fees every 2 minutes and bridges them to Hyperliquid to grow the backing perp position.
            </p>
            <p>
              Mode A is tighter (every trade adjusts the perp immediately). Mode B is looser (perp grows only as creator fees accumulate) but rides pump.fun&apos;s distribution.
            </p>
            <p>
              Verified Mode B launch: <Sol>{LLP_MINT}</Sol> (init tx <Sol kind="tx">{TX_MODEB_LAUNCH}</Sol>).
            </p>
          </Section>

          <Section id="architecture" num="6" title="Architecture">
            <p>
              Three independent layers communicate through asynchronous bridges. There are no synchronous cross-chain calls.
            </p>
            <ol className="ml-6 list-decimal space-y-2">
              <li>
                <strong>Solana bonding curve.</strong> An Anchor program (<Sol>{SOLANA_PROGRAM}</Sol>) holds the constant-product curve,
                mints synthetic SPL tokens, and emits intent events (BuyIntent, SellIntent, HarvestIntent, LaunchInitialized) on every state transition.
              </li>
              <li>
                <strong>Bridge crank (off-chain).</strong> A Node daemon subscribes to the Solana program logs and turns each intent into a deBridge DLN order
                shipping wSOL on Solana into USDC on HyperEVM. It then drives the perp manager via direct EVM calls.
                Source resides at <Code>bot/bridge-crank/index.ts</Code> and runs as a pm2 process on the BWICK val3 validator (159.223.173.162).
              </li>
              <li>
                <strong>LYL Perp Manager on HyperEVM.</strong> A Solidity contract (<Hl>{HYPEREVM_MANAGER_V9}</Hl>) that deposits USDC into Hyperliquid
                via CoreDepositWallet (<Hl>{CORE_DEPOSIT_WALLET}</Hl>), places limit orders via CoreWriter (<Hl>{CORE_WRITER}</Hl>),
                and withdraws USDC back to Solana through the sendAsset action (id 13) targeting the USDC system address (<Hl>{USDC_SYSTEM_ADDR}</Hl>).
              </li>
            </ol>
          </Section>

          <Section id="curve" num="7" title="Bonding curve math">
            <p>
              The curve is constant-product (Uniswap v2 style) with virtual reserves seeded at launch.
              Each launch starts with virtual_sol = 30 SOL and virtual_tokens = 1.073B (in 1e9 base units).
              The invariant k = virtual_sol * virtual_tokens is constant across trades.
            </p>
            <p>
              <strong>Buy.</strong> Given sol_in, the program transfers (sol_in * (1 - fee_bps/10000)) into the launch escrow,
              computes tokens_out via the difference of virtual_tokens before and after, and mints to the user.
            </p>
            <p>
              <strong>Sell.</strong> Inverse formula. Given shares_in, the program computes sol_out,
              applies fee_bps, transfers net_sol_out to the user, then burns the shares.
            </p>
            <p>
              The curve runs in perpetuity. There is no graduation event. Every trade emits an intent for the bridge crank.
              Source: <Code>programs/lyl/src/instructions/{`{buy,sell}`}.rs</Code>.
            </p>
          </Section>

          <Section id="fees" num="8" title="Fee model and minimum buy">
            <h3 className="-mb-1 text-[15px] font-semibold text-[#17372d]">Why is there a 0.15 SOL minimum buy?</h3>
            <p>
              Every buy on a perp-backed launch (Mode A) opens a proportional position on Hyperliquid.
              Doing that requires moving SOL → USDC across chains via deBridge DLN, plus a Solana → HyperEVM
              hop, plus an L1 deposit, plus a CoreWriter limit order. Each of those steps carries a fixed cost.
              At small ticket sizes those fixed costs swamp the trade.
            </p>
            <ul className="ml-6 list-disc space-y-1">
              <li>deBridge solvers quote poorly under ~$10. We&apos;ve observed roughly a <strong>56% haircut at 0.2 SOL</strong> when the solver is unhappy with the size.</li>
              <li>HyperEVM gas + CoreWriter dispatch adds a fixed ~$0.20.</li>
              <li>Jupiter slippage on the eventual USDC → wSOL refill adds another small fixed cost.</li>
            </ul>
            <p>
              0.15 SOL (~$13 at current SOL price) is the empirical floor where the position opens cleanly
              and the curve refills properly. Below that, the perp side either fails to fill or fills at a price that
              orphans the token from its backing. The frontend hard-caps below this threshold; the rebalance
              daemon similarly caps at <Code>MIN_REBALANCE_USDC = $3</Code> for the same reason.
            </p>

            <h3 className="-mb-1 mt-2 text-[15px] font-semibold text-[#17372d]">Why a 1% fee on every trade?</h3>
            <p>
              Each launch carries a <Code>fee_bps</Code> field set at init (default 100, equal to 1%).
              On every buy, <Code>fee_bps × sol_in / 10000</Code> lamports of native SOL are forwarded to the
              bridge cranker wSOL ATA. On every sell, the same percentage of <Code>sol_out</Code> in wSOL
              flows from the launch escrow to that ATA.
            </p>
            <p>The 1% covers the three operational costs the cranker bears on your behalf:</p>
            <ul className="ml-6 list-disc space-y-1">
              <li>Solana gas for <Code>release_to_bridge</Code> and rebalance transactions.</li>
              <li>deBridge protocol fees on each USDC round trip (0.05 HYPE per order plus solver spread).</li>
              <li>Jupiter slippage on the USDC → wSOL conversion that refills launch escrows during rebalance.</li>
            </ul>
            <p>
              None of the 1% goes to a creator or team allocation. Cranker wSOL ATA owner: <Sol>{CRANKER_SOL}</Sol>.
              The ATA is the Associated Token Account of <Code>NATIVE_MINT</Code> under this owner.
            </p>
          </Section>

          <Section id="bridge" num="9" title="Bridge crank">
            <p>
              The crank is a long-running Node process. On each emitted intent it executes a two-phase bridge.
              A naive single-tx implementation that embeds a deBridge hook in the DLN order exceeds the Solana 1232-byte transaction limit,
              so the crank splits the operation into a plain DLN order followed by direct EVM calls to the perp manager.
            </p>
            <p>
              <strong>BuyIntent path:</strong>
            </p>
            <ol className="ml-6 list-decimal space-y-1">
              <li>release_to_bridge ix on Solana drains the buy escrow into the cranker wSOL ATA.</li>
              <li>registerLaunch on the manager (idempotent, no-op if already registered).</li>
              <li>deBridge create-tx HTTP API constructs a wSOL to USDC DLN order. Cranker signs and submits.</li>
              <li>Cranker polls the manager EVM USDC balance until the order is filled (typical 10 to 30s).</li>
              <li>openLaunch on the manager. Approves USDC to CoreDepositWallet, deposits to its L1 perp account, then sends a CoreWriter limit order at mid * 1.005 (long) or mid * 0.995 (short), IOC, with size derived from sol_in * solUsd * leverage / mid.</li>
            </ol>
            <p>
              <strong>SellIntent path:</strong>
            </p>
            <ol className="ml-6 list-decimal space-y-1">
              <li>closeLaunch on the manager. Reduce-only IOC at price slipped 0.5% from mid.</li>
              <li>Cranker verifies a fill appeared in userFills.</li>
              <li>requestBridgeBack on the manager. Two CoreWriter actions: usdClassTransfer (perp to spot) then sendAsset to USDC_SYSTEM_ADDR. Hyperliquid credits the manager EVM USDC balance one L1 block later.</li>
              <li>sweep(USDC, cranker, amount) on the manager pulls the USDC into the cranker EVM wallet.</li>
              <li>Rebalance daemon (separate process) picks up the EVM USDC, creates a deBridge DLN order back to Solana, swaps USDC to wSOL via Jupiter, and transfers wSOL into the relevant launch quote ATA so future sells are funded.</li>
            </ol>
            <p>
              deBridge chain IDs: Solana 7565164, HyperEVM 100000022.
              deBridge DLN source on HyperEVM: <Hl>0xeF4fB24aD0916217251F553c0596F8Edc630EB66</Hl>.
              Fee for the source token swap is paid in native (HYPE on HyperEVM, SOL on Solana).
            </p>
          </Section>

          <Section id="manager" num="10" title="Perp manager (V9)">
            <p>
              The HyperEVM contract that owns all perp activity. Active version is V9 at <Hl>{HYPEREVM_MANAGER_V9}</Hl>.
              The contract is non-upgradeable. Earlier versions (V5 through V8) are deprecated.
              V6 and V7 hold approximately $27 of stranded USDC each on their L1 accounts due to encoding bugs in spotSend that were fixed in V8 (correct decimal scaling) and V9 (sendAsset action 13 with the system address pattern).
            </p>
            <p>
              <strong>Functions.</strong>
            </p>
            <ul className="ml-6 list-disc space-y-1">
              <li><strong>registerLaunch(launchPda, perpAsset, direction, leverage)</strong>: permissionless. Records a launch with its perp asset, side, and target leverage cap.</li>
              <li><strong>openLaunch(launchPda, limitPx, sz, usdcAmount)</strong>: approves USDC, deposits to L1 perp account, places IOC limit order.</li>
              <li><strong>closeLaunch(launchPda, limitPx, sz, solanaRecipient)</strong>: reduce-only IOC.</li>
              <li><strong>requestBridgeBack(launchPda, usdcAmount, solanaRecipient)</strong>: queues a L1 to EVM USDC withdrawal via usdClassTransfer plus sendAsset.</li>
              <li><strong>sweep(token, to, amount)</strong>: owner-only ERC20 transfer out of the manager.</li>
              <li><strong>addApiWallet(apiWallet, name)</strong>: owner-only. Registers an EVM key as a Hyperliquid API wallet for the manager&apos;s L1 account.</li>
              <li><strong>sendCoreAction(bytes)</strong>: owner-only generic CoreWriter passthrough.</li>
              <li><strong>pushUsdcToL1(amount)</strong>: permissionless. Deposits manager EVM USDC into the manager L1 perp account.</li>
              <li><strong>flushSpotUsdc(spotWeiAmount)</strong>: owner-only. Pushes a specific L1 spot USDC amount back to EVM.</li>
            </ul>
            <p>
              Manager EVM owner equals cranker EVM key: <Hl>{CRANKER_EVM}</Hl>.
              The same key is registered as the manager L1 account&apos;s API wallet, giving it authority to sign Hyperliquid REST exchange actions on behalf of the manager.
              Current L1 leverage: 3x cross on BTC. View live state at <HlPos>{HYPEREVM_MANAGER_V9}</HlPos>.
            </p>
          </Section>

          <Section id="rebalance" num="11" title="Rebalance loop">
            <p>
              A third process (sibling to bridge crank and pump fee harvester) maintains the invariant that each launch&apos;s quote escrow holds enough wSOL to refund a typical sell.
            </p>
            <p>
              Every 120 seconds the daemon iterates every Launch account on the program. For each, it compares the on-chain launch_quote_ata wSOL balance to a target ratio of real_sol_reserves (default 50%).
              If actual is below 60% of target, it computes the deficit in USDC, caps it by the manager L1 withdrawable balance, then executes the five-step refill:
            </p>
            <ol className="ml-6 list-decimal space-y-1">
              <li>requestBridgeBack(launchPda, usdcAmount, cranker).</li>
              <li>Wait for USDC arrival on manager EVM (one L1 block).</li>
              <li>sweep(USDC, crankerEvm, amount).</li>
              <li>Cranker creates a deBridge DLN order from its EVM wallet to its Solana wSOL ATA.</li>
              <li>Jupiter swap USDC to wSOL, then SPL token transfer into the target launch_quote_ata.</li>
            </ol>
            <p>
              Cold-start funding requirement: the manager L1 perp account must hold at least MIN_REBALANCE_USDC of free margin (default $3) for the daemon to proceed.
              As cumulative buy volume accumulates margin on the manager, the daemon naturally activates.
            </p>
          </Section>

          <Section id="addresses" num="12" title="Addresses">
            <KV k="Solana program" v={<Sol>{SOLANA_PROGRAM}</Sol>} />
            <KV k="Perp manager (V9)" v={<Hl>{HYPEREVM_MANAGER_V9}</Hl>} />
            <KV k="Bridge cranker (Solana)" v={<Sol>{CRANKER_SOL}</Sol>} />
            <KV k="Bridge cranker (HyperEVM)" v={<Hl>{CRANKER_EVM}</Hl>} />
            <KV k="HyperEVM USDC ERC20" v={<Hl>{HYPEREVM_USDC}</Hl>} />
            <KV k="Core deposit wallet" v={<Hl>{CORE_DEPOSIT_WALLET}</Hl>} />
            <KV k="Core writer precompile" v={<Hl>{CORE_WRITER}</Hl>} />
            <KV k="USDC L1 system address" v={<Hl>{USDC_SYSTEM_ADDR}</Hl>} />
            <KV k="deBridge DLN source (HyperEVM)" v={<Hl>0xeF4fB24aD0916217251F553c0596F8Edc630EB66</Hl>} />
            <KV k="Pump.fun program" v={<Sol>6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P</Sol>} />
          </Section>

          <Section id="proofs" num="13" title="On-chain proofs">
            <p>The transactions below verify each subsystem against live mainnet state. Click any to open the explorer.</p>
            <KV k="Program upgrade (curve fees activated)" v={<Sol kind="tx">{TX_PROGRAM_UPGRADE}</Sol>} />
            <KV k="V9 manager: addApiWallet (cranker becomes signer)" v={<Hl kind="tx">{TX_V9_ADDAPI}</Hl>} />
            <KV k="V9 manager: pushUsdcToL1 (margin reserve seeded)" v={<Hl kind="tx">{TX_V9_PUSHUSDC}</Hl>} />
            <KV k="Mode A buy fills BTC long at 3x on V9" v={<Hl kind="tx">{TX_V9_BUY_FILL}</Hl>} />
            <KV k="Phase 1 USDC bridge-back from V9 L1 to EVM" v={<Hl kind="tx">{TX_PHASE1_LIVE}</Hl>} />
            <KV k="Rebalance: USDC delivered from V9 to Solana" v={<Hl kind="tx">{TX_REBALANCE_BRIDGE}</Hl>} />
            <KV k="Mode B launch (pump.fun-routed)" v={<Sol kind="tx">{TX_MODEB_LAUNCH}</Sol>} />
            <KV k="TEST/TST live launch (Mode A)" v={<Sol>{TEST_MINT}</Sol>} />
            <KV k="V9 L1 perp account (live position viewer)" v={<HlPos>{HYPEREVM_MANAGER_V9}</HlPos>} />
          </Section>

          <Section id="risk" num="14" title="Risk and limitations">
            <ul className="ml-6 list-disc space-y-3">
              <li>
                <strong>Cranker key is hot.</strong> The bridge cranker EVM key controls the manager (owner of V9) and the Solana cranker key signs release_to_bridge.
                If either key is compromised the manager USDC and the Solana wSOL transit pool can be drained. There is no multisig in V1.
              </li>
              <li>
                <strong>Cranker bears bridge fees.</strong> Each rebalance round trip costs roughly $2.50 in deBridge protocol fees plus solver spread plus Jupiter slippage.
                Curve fees (1% per trade) accrue to the cranker to amortize this. For tokens with low volume the fee revenue may not cover operational costs.
              </li>
              <li>
                <strong>Solver pricing on small bridges.</strong> deBridge DLN solvers quote poorly for sub-$10 SOL to USDC bridges
                (observed roughly 56% haircut at 0.2 SOL). The frontend enforces a minimum buy of 0.15 SOL and the rebalance daemon caps at MIN_REBALANCE_USDC = $3.
              </li>
              <li>
                <strong>Perp risk passes to token holders.</strong> Token NAV moves with the mark of the backing perp times leverage.
                Liquidations on the manager L1 account would reduce the curve&apos;s ability to refund sellers in full.
                Current default leverage is 3x cross. Default direction is long. Hyperliquid L1 liquidation occurs at maintenance margin breach.
              </li>
              <li>
                <strong>Stranded funds on retired managers.</strong> V6 and V7 hold approximately $15.92 and $11.65 respectively on their L1 accounts.
                These contracts lack the spot recovery function and the funds cannot be recovered without redeploying logic at the same address (impossible for non-upgradeable contracts).
                V9 onward includes flushSpotUsdc as a recovery escape hatch.
              </li>
              <li>
                <strong>No KYC, no warranty.</strong> The launchpad is an interface to decentralized protocols. Token launches are conducted by third parties.
                The operators do not endorse any specific launch.
              </li>
            </ul>
          </Section>

          <Section id="faq" num="15" title="FAQ">
            <p><strong>Is this a pump.fun fork?</strong> No. We share the bonding-curve mechanic but add a Hyperliquid perp behind every launch. Mode B can route through pump.fun&apos;s curve for distribution.</p>
            <p><strong>Why Hyperliquid and not dYdX or another perp DEX?</strong> Hyperliquid has the deepest non-CEX perp orderbook, no KYC, and a precompile (CoreWriter) that lets a smart contract place orders programmatically. None of the other perp DEXes have this property today.</p>
            <p><strong>Why cap leverage at 3x?</strong> Above 3x the perp liquidates too easily on normal market noise, which would orphan the curve from its backing. 3x balances upside with survivability.</p>
            <p><strong>Can I launch with my own assets as backing?</strong> Only assets Hyperliquid lists. As of writing this is ~150 perps (BTC, ETH, SOL, all majors, all mid-cap memes).</p>
            <p><strong>Can the curve be drained?</strong> No. The curve is a constant-product invariant. The only way SOL leaves the curve is in exchange for the corresponding token amount.</p>
            <p><strong>What if Hyperliquid goes down?</strong> The Solana curve keeps trading. New buys queue intents that bridge once Hyperliquid recovers. Sells refund from the existing wSOL escrow.</p>
            <p><strong>What if Solana goes down?</strong> The Hyperliquid perp keeps running and any open position remains hedgeable. New buys and sells pause until Solana recovers.</p>
            <p><strong>What if deBridge goes down?</strong> Bridge crank stops. Sells still refund from existing wSOL escrow. Buys still mint tokens. The perp adjustment is delayed until deBridge resumes.</p>
          </Section>

          <footer className="mt-16 border-t border-[#065f46]/15 pt-6 text-xs text-[#6f857c]">
            Last verified against mainnet on 2026-05-19. All figures and addresses observable on the linked explorers.
          </footer>
        </main>
      </div>
    </AppShell>
  );
}
