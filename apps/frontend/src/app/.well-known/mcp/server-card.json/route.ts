import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    schema_version: "0.1",
    serverInfo: {
      name: "ArcPay Mantle MCP",
      version: "0.1.5",
      description: "Hosted ArcPay tools for Mantle agent treasury, x402, privacy, invoices, RealClaw handoff, ZeroDev, and evidence planning.",
    },
    transport: {
      type: "http",
      endpoint: "https://arcpay-mantle.vercel.app/api/mcp",
      auth: "bearer-or-public-rate-limited",
    },
    capabilities: {
      tools: true,
      resources: false,
      prompts: false,
    },
    packages: {
      npm: "@arcpaylabs/mantle-mcp",
      cli: "@arcpaylabs/mantle-cli",
      starter: "@arcpaylabs/mantle-x402-agent-starter",
    },
  });
}
