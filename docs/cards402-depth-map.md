# Cards402 Depth Map for ArcPay Mantle

This repo adapts the strongest Cards402 patterns without copying its
Stellar/card-specific implementation.

| Cards402 pattern | ArcPay Mantle implementation |
| --- | --- |
| MCP server | `apps/mcp/server.mjs` exposes deployment lookup, agent ID derivation, claim hash derivation, and demo path. Published as `@arcpaylabs/mantle-mcp`. |
| `skill.md` / `llms.txt` | Root files describe how agents, operators, and reviewers should operate the app. |
| x402 HTTP payment gate | `apps/x402-server/server.mjs` returns real `402 Payment Required` quotes, verifies Mantle order state, and unlocks agent work after fulfillment. |
| Order state machine | `AgentOrderBook` supports pending, accepted, processing, fulfilled, settled, refunded, and failed. |
| Operator dashboard | Frontend includes dashboard, operator, policies, audit, proofs, agents, and orders pages. |
| Time-window policies | `TreasuryPolicy` enforces hourly, daily, weekly, UTC-hour windows, allowlists, emergency pause, and per-order approvals. |
| Circuit-breaker webhooks | `OperatorControls` tracks per-origin webhook failures and opens a breaker after repeated failures. |
| Agent claim code onboarding | `OperatorControls` creates and redeems expiring claim codes by hash. |
| CLI tool | `apps/cli/arcpay-mantle.mjs` supports contracts, wallet, agent ID, claim hash, demo path, and MCP config commands. Published as `@arcpaylabs/mantle-cli`. |
| Card-like spend product | `AgentSpendCardVault` creates ArcPay test-credit-backed virtual cards for agent budgets. |
| Privacy layer | `MantlePrivacyVault` creates commitment-based MNT/test-credit payment intents with encrypted metadata and nullifier release. |

## Mantle-Native Layer

`MantleAgentRiskOracle` is built around a `createRequest`-style agent platform
interface:

```solidity
function createRequest(
  uint256 agentId,
  address callback,
  bytes4 callbackSelector,
  bytes calldata payload
) external payable returns (uint256 requestId);
```

When a live Mantle Agent platform contract address is available, set:

```bash
MANTLE_AGENT_PLATFORM=0x...
MANTLE_RISK_AGENT_ID=...
```

Then redeploy with:

```bash
npm run deploy:mantle
```

If those envs are absent, the deploy script uses a mock platform so reviewers can
still run the same request/callback lifecycle locally or on testnet.

Current deployment uses Mantle's testnet agent requester:

```text
mock Mantle agent platform until a live Byreal/agent platform address is provided
```

Default agent ID:

```text
13174292974160097713
```

The reviewer-verifiable smoke path exercises this integration with the deployed
platform deposit, an on-chain `RiskRequested` event, and owner demo fulfillment:

```bash
npm run smoke:live
npm run smoke:x402
```
