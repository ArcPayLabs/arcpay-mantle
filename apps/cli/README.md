# ArcPay Mantle CLI

Developer CLI for ArcPay Mantle. It prints deployed contract addresses, derives IDs used by the contracts, returns integration guides, and generates MCP config.

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
arcpay-mantle demo-path
arcpay-mantle smoke
arcpay-mantle mcp-config
```

## Live Surfaces

- App: https://arcpay-mantle.vercel.app
- Docs: https://arcpay-mantle.vercel.app/docs/overview
- x402: https://mantle-x402.20.208.46.195.nip.io
- OpenAPI: https://arcpay-mantle.vercel.app/openapi.json

The CLI is a developer helper. It does not hold private keys or sign treasury transactions.
