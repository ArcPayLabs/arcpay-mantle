# ArcPay Mantle Launch Copy

## X Post

ArcPay is live on Mantle Testnet.

We built a control plane for AI-agent treasury work:

- x402 paid agent resources
- escrowed orders and audit evidence
- USDY cards for agent spend limits
- privacy intents
- RealClaw / Byreal-style handoff flows
- policy-gated treasury execution
- CLI, MCP, and starter kit for developers

Live app: https://arcpay-mantle.vercel.app
Docs: https://arcpay-mantle.vercel.app/docs/overview

Image: `social/arcpay-mantle-x-launch.png`

## Telegram / Discord

ArcPay Mantle is live on Mantle Testnet.

It is an agent treasury control plane for x402 paid work, escrowed orders, USDY agent cards, privacy intents, RealClaw/Byreal-style handoffs, and audit evidence. Builders can use the dashboard, CLI, MCP server, or starter kit to onboard agents and prove execution.

Live app: https://arcpay-mantle.vercel.app
Docs: https://arcpay-mantle.vercel.app/docs/overview

Open to feedback from Mantle builders, especially teams working on AI agents, DeFi automation, RWA/yield flows, and agent wallets.

## NPM Packages

```bash
npm i -g @arcpaylabs/mantle-cli
npx @arcpaylabs/mantle-mcp
npm i @arcpaylabs/mantle-x402-agent-starter
```

## Demo Flow

1. Open the live app and connect a Mantle Testnet wallet.
2. Show dashboard status and deployed contract map.
3. Open Agents and show bring-your-own-agent onboarding.
4. Open Policies and show spend/action controls.
5. Open x402 and show quote, payment requirement, verify, and unlock.
6. Open RealClaw and show handoff/evidence path.
7. Open Cards and show USDY agent card flow.
8. Open Privacy, Invoices, Audit, and Status to show proof capture.
