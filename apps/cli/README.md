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
arcpay-mantle realclaw-handoff
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
