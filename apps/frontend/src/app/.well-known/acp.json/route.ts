import { NextResponse } from "next/server";

const origin = "https://arcpay-mantle.vercel.app";

export function GET() {
  return NextResponse.json({
    protocol: "agentic-commerce-protocol",
    name: "ArcPay Mantle",
    version: "0.1.0",
    website: origin,
    network: {
      chain: "mantle-testnet",
      currency: "MNT",
    },
    capabilities: [
      "x402-paid-agent-work",
      "mcp-tools",
      "agent-onboarding",
      "policy-gated-spend",
      "privacy-intents",
      "realclaw-handoff",
      "zerodev-userops",
      "merchant-moe-adapters",
      "audit-evidence",
    ],
    discovery: {
      openapi: `${origin}/openapi.json`,
      llms: `${origin}/llms.txt`,
      apiCatalog: `${origin}/.well-known/api-catalog`,
      mcp: `${origin}/.well-known/mcp/server-card.json`,
      x402: `${origin}/platform/v2/x402/discovery/resources`,
    },
  });
}
