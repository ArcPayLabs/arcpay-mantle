# ArcPay Mantle Demo Video Plan

Target: 4:30-4:55.

## Assets

- App: https://arcpay-mantle.vercel.app
- Docs: https://arcpay-mantle.vercel.app/docs/overview
- QA screenshots: `C:\Users\RICHEY_SON\Desktop\arcpay-mantle\qa-full-ui`
- QA report: `QA_REPORT.md`

## Shot List

| Time | Shot | Action |
| --- | --- | --- |
| 0:00-0:20 | Landing page | Show ArcPay as Mantle agent treasury infrastructure, not a generic demo. |
| 0:20-0:45 | Problem | Explain that autonomous agents need payment limits, spend policies, x402 access, and evidence before they can safely move funds. |
| 0:45-1:15 | Auth and dashboard | Show wallet-first access, workspace, live Mantle Testnet context, status, and treasury overview. |
| 1:15-1:55 | Agents and RealClaw | Show bring-your-own-agent plus RealClaw/Byreal handoff payload and evidence boundaries. |
| 1:55-2:35 | x402 | Show quote, HTTP 402 protected resource, payment requirements, order verification, and unlock flow. |
| 2:35-3:10 | Policies and privacy | Show spend controls, allowlists, privacy intent, and audit evidence rules. |
| 3:10-3:45 | DeFi/RWA | Show Merchant Moe, USDY, mETH, RealClaw, and policy-gated intent/evidence flow. |
| 3:45-4:20 | Developer surfaces | Show docs, API catalog, MCP card, agent skills, CLI/MCP/npm packages, and starter kit. |
| 4:20-4:50 | Proof close | Show status page, QA report, contract addresses, and what evidence is required before claiming execution. |

## Wallet Approval Inserts

Use only when recording live:

1. Connect wallet and switch to Mantle Sepolia/Testnet.
2. Wallet auth signature.
3. Agent registration transaction if captured live.
4. x402/order transaction if captured live.
5. Privacy or invoice transaction if captured live.

If a transaction takes too long, pause recording and resume on the confirmed tx/hash/evidence page.

## Recording Rule

Do not say "executed" unless the recording shows at least one of:

- Mantle transaction hash
- x402 verification response
- ArcPay order ID with fulfilled/settled state
- RealClaw/Byreal handoff evidence plus operator confirmation
- ArcPay audit record with source evidence
