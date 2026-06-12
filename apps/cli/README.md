# ArcPay Mantle CLI

ArcPay Mantle CLI is the operator kit for wiring an agent into ArcPay without using the frontend. It helps builders register deterministic agent IDs, inspect deployed Mantle contracts, prepare invoice IDs and privacy commitments, generate x402 payment instructions, create RealClaw/Byreal handoff payloads, inspect ZeroDev and Mantle DeFi/RWA readiness, and print exact smoke-test commands for proving the integration works on Mantle Testnet.

## Install

```bash
npm install -g @arcpaylabs/mantle-cli
```

## Commands

```bash
arcpay-mantle contracts
arcpay-mantle wallet
arcpay-mantle agent-id research-agent
arcpay-mantle invoice-id inv_001
arcpay-mantle claim-hash claim-research-agent-001
arcpay-mantle privacy-commit "invoice-secret"
arcpay-mantle privacy-guide
arcpay-mantle invoice-guide
arcpay-mantle x402-guide
arcpay-mantle onboard-agent treasury-router https://your-agent.example/work 0.001
arcpay-mantle card-guide treasury-router 0xAgentWallet 5
arcpay-mantle policy-guide treasury-router 10
arcpay-mantle evidence-template
arcpay-mantle realclaw-handoff
arcpay-mantle defi-status
arcpay-mantle zerodev-status
arcpay-mantle demo-path
arcpay-mantle smoke
arcpay-mantle mcp-config
```

## Live Surfaces

- App: https://arcpay-mantle.vercel.app
- Docs: https://arcpay-mantle.vercel.app/docs/overview
- x402: https://mantle-x402.20.208.46.195.nip.io
- OpenAPI: https://arcpay-mantle.vercel.app/openapi.json

The CLI is part of ArcPay's developer distribution layer. It does not hold private keys or sign treasury transactions; it prepares the IDs, payloads, guides, and verification steps an operator or agent team needs before sending a transaction.

## Operator Kit Flows

`onboard-agent` generates the payload a developer or AI agent needs to connect an existing endpoint to ArcPay: deterministic `agentId`, x402 URL, registry/order/policy/operator contracts, and required next steps.

`card-guide` prepares a USDY card plan for an agent wallet: `cardId`, vault/token contracts, approval/top-up/spend calls, and evidence required before an operator can mark the card flow complete.

`policy-guide` separates global workspace controls from per-agent controls so builders can enforce both. The CLI does not silently sign anything; it produces the plan and proof requirements that a wallet, RealClaw flow, backend signer, or agent runtime must execute.
