import { NextResponse, type NextRequest } from "next/server";

const MARKDOWN_HOME = `# ArcPay Mantle

ArcPay Mantle is a control plane and developer distribution layer for AI-agent treasury operations on Mantle Testnet.

## Agent entrypoints

- App: https://arcpay-mantle.vercel.app
- Docs: https://arcpay-mantle.vercel.app/docs/overview
- OpenAPI: https://arcpay-mantle.vercel.app/openapi.json
- Hosted MCP bridge: https://arcpay-mantle.vercel.app/api/mcp
- Agent skills index: https://arcpay-mantle.vercel.app/.well-known/agent-skills/index.json
- x402 gateway: https://mantle-x402.20.208.46.195.nip.io

## Capabilities

- Agent registry and bring-your-own-agent onboarding
- x402 protected paid agent work
- MNT escrow and order verification
- USDY spend cards
- Privacy intents and audit release records
- RealClaw handoff, Merchant Moe adapter status, ZeroDev sponsorship, CLI, MCP, and starter kits
`;

export function proxy(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  if (request.nextUrl.pathname === "/" && accept.includes("text/markdown")) {
    return new NextResponse(MARKDOWN_HOME, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "x-markdown-tokens": String(MARKDOWN_HOME.split(/\s+/).length),
      },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
