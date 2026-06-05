import { NextResponse } from "next/server";

const venues = [
  {
    name: "RealClaw / Byreal Skills",
    category: "agent-executor",
    state: "handoff-live",
    execution: "operator-configured Telegram agent receives ArcPay policy payload and returns venue evidence",
    url: "https://www.byreal.io/en/realclaw",
    evidence: ["registered agent address", "venue response", "transaction hash", "volume/ROI snapshot"],
  },
  {
    name: "Byreal SDK",
    category: "byreal-reference-sdk",
    state: "reference-only-solana-sdk",
    execution: "official SDK is Solana-focused; ArcPay Mantle does not import it as a Mantle executor",
    url: "https://github.com/byreal-git/byreal-sdk",
    evidence: ["SDK package metadata", "Solana web3 dependency", "CLMM/router examples", "Mantle boundary note"],
  },
  {
    name: "Merchant Moe",
    category: "dex-router",
    state: "adapter-target",
    execution: "router/pool interaction after operator approval",
    docs: "https://docs.merchantmoe.com/",
    evidence: ["route quote", "router address", "swap transaction hash", "before/after balance"],
  },
  {
    name: "Agni Finance",
    category: "dex-liquidity",
    state: "adapter-target",
    execution: "liquidity route or manual signer execution after policy approval",
    url: "https://agni.finance/",
    evidence: ["pool route", "transaction hash", "LP or swap state"],
  },
  {
    name: "Fluxion",
    category: "realclaw-venue",
    state: "campaign-evidence",
    execution: "RealClaw venue activity with evidence mirrored into ArcPay",
    evidence: ["agent address", "venue result", "transaction hash", "risk snapshot"],
  },
  {
    name: "USDY / mETH",
    category: "rwa-yield",
    state: "intent-live",
    execution: "RWA/yield allocation intent with policy, drawdown, and audit requirements",
    evidence: ["operator approval", "allocation tx", "final balance", "risk memo"],
  },
];

export async function GET() {
  return NextResponse.json({
    ok: true,
    chain: "mantle-testnet",
    chainId: 5003,
    mode: "agentic-defi-rwa-intents",
    boundary: "ArcPay marks Mantle DeFi/RWA actions complete only after tx, x402 order, signed operator record, or venue evidence exists.",
    venues,
    developerTools: {
      http: "/api/developer/tools/realclaw_handoff",
      mcp: "realclaw_handoff",
      cli: "arcpay-mantle realclaw-handoff",
    },
    nextProofTarget: "Attach RealClaw agent address plus Merchant Moe, Agni, Fluxion, USDY, or mETH tx evidence to an ArcPay audit record.",
  });
}
