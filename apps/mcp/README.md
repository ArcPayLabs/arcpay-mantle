# ArcPay Mantle MCP

Local MCP server for ArcPay Mantle. It exposes safe developer tools for Mantle Testnet deployments, x402 payment gates, invoice IDs, claim hashes, privacy commitments, and repeatable demo paths.

## Install

```bash
npm install -g @arcpaylabs/mantle-mcp
```

## Claude Desktop

Add this to your Claude Desktop MCP config:

```json
{
  "mcpServers": {
    "arcpay-mantle": {
      "command": "arcpay-mantle-mcp"
    }
  }
}
```

Restart Claude Desktop after editing the config.

## Tools

- `get_deployment`
- `derive_agent_id`
- `derive_invoice_id`
- `derive_claim_hash`
- `derive_privacy_commitment`
- `privacy_intent_guide`
- `invoice_guide`
- `x402_guide`
- `demo_path`
- `smoke_commands`

## Hosted Surfaces

- App: https://arcpay-mantle.vercel.app
- Docs: https://arcpay-mantle.vercel.app/docs/overview
- OpenAPI: https://arcpay-mantle.vercel.app/openapi.json
- llms.txt: https://arcpay-mantle.vercel.app/llms.txt
- x402: https://mantle-x402.20.208.46.195.nip.io

The MCP server does not sign transactions or mutate treasury state. It only returns deterministic IDs, integration guidance, and public deployment metadata.
