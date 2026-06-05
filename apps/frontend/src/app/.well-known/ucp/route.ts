import { NextResponse } from "next/server";

const origin = "https://arcpay-mantle.vercel.app";

export function GET() {
  return NextResponse.json({
    protocol: "universal-commerce-protocol",
    name: "ArcPay Mantle",
    website: origin,
    payments: {
      x402: `${origin}/platform/v2/x402/discovery/resources`,
      protectedResource: "https://mantle-x402.20.208.46.195.nip.io/agent/treasury-router/work",
    },
    agentAccess: {
      auth: `${origin}/auth.md`,
      mcp: `${origin}/api/mcp`,
      skills: `${origin}/.well-known/agent-skills/index.json`,
    },
  });
}
