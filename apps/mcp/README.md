# ArcPay Mantle MCP

ArcPay Mantle MCP is ArcPay for AI agents. Claude Desktop, Codex-compatible hosts, and other MCP clients can ask ArcPay for Mantle deployment data, derive agent and invoice IDs, prepare x402 paid-resource flows, generate privacy/invoice instructions, build RealClaw/Byreal handoff payloads, inspect ZeroDev and Mantle DeFi/RWA evidence requirements, and return evidence checklists before claiming any work is complete.

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
- `agent_onboarding_payload`
- `usdy_card_plan`
- `policy_plan`
- `evidence_template`
- `realclaw_handoff`
- `mantle_defi_rwa_status`
- `zerodev_status`
- `demo_path`
- `smoke_commands`

## Hosted Surfaces

- App: https://arcpay-mantle.vercel.app
- Docs: https://arcpay-mantle.vercel.app/docs/overview
- OpenAPI: https://arcpay-mantle.vercel.app/openapi.json
- llms.txt: https://arcpay-mantle.vercel.app/llms.txt
- x402: https://mantle-x402.20.208.46.195.nip.io

The MCP server makes ArcPay usable by agents directly, not only by humans clicking a dashboard. It does not sign transactions or mutate treasury state; it returns deterministic IDs, integration guidance, handoff payloads, and public deployment metadata that an operator can verify before execution.

## Agent-Native Flows

`agent_onboarding_payload` lets Claude/Codex/custom agents request the same onboarding payload a dashboard user gets: agent id, x402 endpoint, contract map, policy requirements, and claim-code steps.

`usdy_card_plan` lets an agent or developer prepare card issuance without touching the dashboard. It returns the card id, vault/token contracts, call sequence, and proof requirements for create/top-up/spend.

`policy_plan` returns both global workspace controls and per-agent controls, so an agent can explain what it is allowed to do before attempting any paid or money-moving action.

`evidence_template` is the guardrail: it tells the agent exactly what hashes, API responses, RealClaw evidence, venue receipts, and screenshots are required before it can claim completion.
