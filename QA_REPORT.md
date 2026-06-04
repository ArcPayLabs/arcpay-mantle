# ArcPay Mantle QA Report

Generated: 2026-06-04

## Automated Browser QA

- Public app: https://arcpay-mantle.vercel.app
- API checks: 11 / 11 passed
- Browser route checks: 24 / 24 passed
- Viewports: desktop 1440x1000, mobile 390x844
- Screenshot artifacts: `C:\Users\RICHEY_SON\Desktop\arcpay-qa-artifacts-rerun\mantle`

## Routes Checked

- `/`
- `/sign-in`
- `/beta`
- `/status`
- `/agents`
- `/x402`
- `/realclaw`
- `/privacy`
- `/swaps`
- `/yield`
- `/analytics`
- `/dashboard`

Each route loaded on desktop and mobile without detected horizontal overflow.

## API Surfaces Checked

- `/.well-known/agent-skills/index.json`
- `/.well-known/mcp/server-card.json`
- `/.well-known/api-catalog`
- `/api/status`
- `/api/mantle/defi/status`
- `/api/zerodev/status`
- `/api/zerodev/sponsor-policy`
- `/platform/v2/x402/discovery/resources`
- `/openapi.json`
- `/llms.txt`
- `/auth.md`

## Live Product Notes

- Mantle x402 discovery, MCP card, agent-skills, OpenAPI, and auth docs are live.
- RealClaw/Byreal handoff flow is represented in `/realclaw` with ArcPay policy, x402, order, privacy, and audit evidence boundaries.
- ZeroDev status and sponsorship policy endpoints are live for Arbitrum-compatible smart-account evidence.
- Mantle DeFi/RWA flows remain policy-gated evidence flows; completion requires transaction, venue, or signed operator evidence.

## Manual Wallet QA Still Required

The automated pass does not click wallet extension prompts. Manual wallet QA should cover:

1. Connect funded Mantle wallet.
2. Create or load workspace.
3. Register an agent.
4. Create x402 quote/order and capture order evidence.
5. Generate RealClaw handoff evidence.
6. Create privacy, swap/yield, invoice/card records.
7. Confirm records appear in audit/status views.
