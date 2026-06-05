import { NextResponse } from "next/server";

const origin = "https://arcpay-mantle.vercel.app";

export function GET() {
  return NextResponse.json({
    protocol: {
      name: "acp",
      version: "0.1.0",
    },
    name: "ArcPay Mantle",
    version: "0.1.0",
    api_base_url: origin,
    supported_transports: ["https", "mcp", "x402"],
    website: origin,
    network: {
      chain: "mantle-testnet",
      currency: "MNT",
    },
    capabilities: {
      services: [
        {
          id: "mantle-agent-treasury",
          name: "Mantle agent treasury",
          description: "Policy-gated x402 work, RealClaw handoff, ZeroDev UserOps, privacy intents, cards, invoices, and audit evidence.",
          payment_protocols: ["x402"],
          auth: `${origin}/auth.md`,
          openapi: `${origin}/openapi.json`,
        },
      ],
      features: [
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
    },
    discovery: {
      openapi: `${origin}/openapi.json`,
      llms: `${origin}/llms.txt`,
      apiCatalog: `${origin}/.well-known/api-catalog`,
      mcp: `${origin}/.well-known/mcp/server-card.json`,
      x402: `${origin}/platform/v2/x402/discovery/resources`,
    },
  });
}
