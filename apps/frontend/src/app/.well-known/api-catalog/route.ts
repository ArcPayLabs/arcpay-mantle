import { NextResponse } from "next/server";

const base = "https://arcpay-mantle.vercel.app";

export function GET() {
  return NextResponse.json(
    {
      linkset: [
        {
          anchor: `${base}/api`,
          "service-desc": [{ href: `${base}/openapi.json`, type: "application/openapi+json" }],
          "service-doc": [{ href: `${base}/docs/overview`, type: "text/html" }],
          status: [{ href: `${base}/api/status`, type: "application/json" }],
          "mcp-server-card": [{ href: `${base}/.well-known/mcp/server-card.json`, type: "application/json" }],
          "agent-skills": [{ href: `${base}/.well-known/agent-skills/index.json`, type: "application/json" }],
        },
        {
          anchor: "https://mantle-x402.20.208.46.195.nip.io",
          "service-doc": [{ href: `${base}/docs/x402-agent-payments`, type: "text/html" }],
          status: [{ href: `${base}/api/status`, type: "application/json" }],
        },
      ],
    },
    { headers: { "Content-Type": "application/linkset+json; charset=utf-8" } },
  );
}
