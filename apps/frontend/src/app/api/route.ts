import { NextResponse } from "next/server";

const origin = "https://arcpay-mantle.vercel.app";

export function GET() {
  return NextResponse.json({
    name: "ArcPay Mantle API",
    description: "Agent treasury, x402, MCP, RealClaw, ZeroDev, privacy, cards, invoices, and audit APIs.",
    openapi: `${origin}/openapi.json`,
    llms: `${origin}/llms.txt`,
    status: `${origin}/api/status`,
    integrations: `${origin}/api/integrations`,
    mcp: `${origin}/api/mcp`,
    developerTools: `${origin}/api/developer/tools`,
    x402Discovery: `${origin}/platform/v2/x402/discovery/resources`,
    agentSkills: `${origin}/.well-known/agent-skills/index.json`,
  });
}
