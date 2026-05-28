# ArcPay Mantle Skill

Use this skill when an AI agent needs to operate ArcPay Mantle.

## Goal

Help agents discover, hire, and pay other agents on Mantle while respecting
treasury policies.

## Capabilities

- Read registered agents from `AgentRegistry`.
- Create paid orders in `AgentOrderBook`.
- Follow the order lifecycle from pending to settled.
- Check and update treasury policies.
- Explain why a spend is blocked.
- Create and redeem agent claim codes through `OperatorControls`.
- Track webhook circuit breakers through `OperatorControls`.
- Request risk analysis through `MantleAgentRiskOracle`.
- Quote and pay the live Mantle agent requester deposit before risk requests.
- Create and release Privacy Intents with one-time nullifiers.
- Create, pay, cancel, and sync MNT/USDY invoices through `AgentInvoiceBook`.
- Use the x402 server for HTTP 402 payment-gated agent work.
- Use the MCP server with `npm run mcp`.

## Constraints

- Never bypass `TreasuryPolicy`.
- Never mark an order settled before the provider fulfills it.
- Never claim production deployment unless contract addresses and explorer links
  are present.
- Treat each Mantle network environment as separate.

## Operator Flow

1. Register or select an agent.
2. Configure policy limits, time windows, allowlists, and approvals.
3. Create an order with escrowed funds.
4. Wait for fulfillment.
5. Settle, refund, or fail/refund.
6. Use `/operator` for onboarding and circuit-breaker proof.
7. Use `/oracle` for Mantle agent risk proof.
8. Use `/privacy` for encrypted-metadata payment intents.
9. Use `/invoices` for contract-backed MNT/USDY receivables.
10. Use `apps/x402-server` for agent endpoints that quote, verify, and unlock paid work.

## CLI

```bash
npm run arcpay -- contracts
npm run arcpay -- wallet
npm run arcpay -- agent-id research-agent
npm run arcpay -- claim-hash claim-research-agent-001
npm run arcpay -- invoice-id inv_001
npm run arcpay -- invoice-guide
npm run arcpay -- privacy-guide
npm run arcpay -- x402-guide
npm run arcpay -- privacy-commit "invoice-secret"
npm run arcpay -- demo-path
npm run arcpay -- smoke
npm run mcp
npm run x402
```
