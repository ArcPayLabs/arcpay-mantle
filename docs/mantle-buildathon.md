# ArcPay Mantle Buildathon Plan

## Thesis

ArcPay Mantle is an AI-agent treasury, RWA operations, and paid-service network
for Mantle. Agents register capabilities, discover one another, request work,
escrow payment, complete jobs, and settle under programmable treasury policy.

## Why Mantle

The Turing Test Hackathon asks builders to deploy autonomous agents on Mantle,
record decisions on-chain, and show real ecosystem contribution. ArcPay uses
Mantle as the settlement and evidence layer for agent financial operations:

- agents are first-class service providers and treasury operators
- agent-to-agent orders are onchain
- x402 endpoints monetize agent work over HTTP
- USDY/mETH strategy intents connect agent finance to Mantle RWA themes
- Byreal/RealClaw-style agent workflows can call ArcPay tools for payment,
  policy, invoices, and reputation
- treasury spend policies are enforced before settlement
- every job creates an auditable order lifecycle

## MVP Flow

1. Agent owner registers an agent in `AgentRegistry`.
2. Operator configures hourly/daily treasury policy in `TreasuryPolicy`.
3. Operator allowlists an agent if allowlist mode is enabled.
4. Requester creates an escrowed order in `AgentOrderBook`.
5. x402 server verifies the paid order before protected agent work unlocks.
6. Provider accepts, processes, and fulfills the order.
7. Requester settles the order, releasing funds through `AgentTreasury`.
8. Dashboard, audit, and proof pages show the order lifecycle and contract events.

## Mantle Testnet

| Field | Value |
| --- | --- |
| Chain ID | `5003` / `0x138b` |
| Currency | `MNT` |
| Block gas limit | `499999998` |
| RPC | `https://rpc.sepolia.mantle.xyz` |
| Explorer | `https://sepolia.mantlescan.xyz` |

## Contracts

- `AgentRegistry.sol`: agent identity, endpoint, capabilities, price, active state
- `TreasuryPolicy.sol`: hourly/daily spend limits, approval threshold, allowlist, emergency pause
- `AgentTreasury.sol`: escrow and settlement
- `AgentOrderBook.sol`: order state machine
- `AgentInvoiceBook.sol`: MNT/USDY invoice lifecycle
- `OperatorControls.sol`: claim-code onboarding and webhook circuit breakers
- `MantleAgentRiskOracle.sol`: agent risk request/callback evidence
- `AgentSpendCardVault.sol`: USDY agent budget cards
- `MantlePrivacyVault.sol`: commitment-based privacy intents
- `AgentReputationBook.sol`: order-backed agent reputation
- `apps/x402-server`: HTTP 402 quote, verification, fulfillment helper, and unlock surface

## Deployment

Mantle Sepolia deployment metadata:

```text
deployments/mantle-testnet.json
```

| Contract | Address |
| --- | --- |
| `AgentRegistry` | Pending Mantle Sepolia deploy |
| `TreasuryPolicy` | Pending Mantle Sepolia deploy |
| `AgentTreasury` | Pending Mantle Sepolia deploy |
| `AgentOrderBook` | Pending Mantle Sepolia deploy |
| `OperatorControls` | Pending Mantle Sepolia deploy |
| `MantleAgentRiskOracle` | Pending Mantle Sepolia deploy |
| `AgentSpendCardVault` | Pending Mantle Sepolia deploy |
| `MantlePrivacyVault` | Pending Mantle Sepolia deploy |
| `AgentInvoiceBook` | Pending Mantle Sepolia deploy |
| `AgentReputationBook` | Pending Mantle Sepolia deploy |

## Judging Alignment

- Technical depth: Solidity contracts, x402 gateway, worker indexing, MCP/CLI,
  and a full wallet-first frontend
- Innovation: agent treasury policy, paid HTTP agent work, privacy intents, and
  order-backed reputation in one Mantle-native product
- Mantle contribution: MNT escrow, USDY/mETH strategy intents, Mantle Sepolia
  deployment, and reusable developer tools for Mantle agents
- Product completeness: live UI, docs, smoke tests, and demo path

## Product Surface

The UI is not a standalone toy page. It ports the ArcPay treasury operating
system into a Mantle-only testnet app:

- wallet-first onboarding through EVM wallet switching to chain `5003`
- agent discovery and service pricing through live Mantle contracts
- x402-style paid agent endpoints that quote exact MNT requirements and unlock after on-chain fulfillment
- escrowed agent orders with explicit lifecycle actions
- real policy enforcement before order creation
- direct MNT payouts for operator-controlled payments
- local invoices, contractors, audit logs, and proof pages for a complete demo
- claim-code onboarding and webhook circuit-breaker controls
- Mantle `createRequest`-compatible risk oracle for agentic policy decisions
- USDY-backed agent spend cards with limits, balances, spend events, and freeze controls
- commitment-based private payment intents with encrypted metadata and nullifier release
