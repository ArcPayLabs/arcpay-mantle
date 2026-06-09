# Live Wallet And Agent QA Plan

Use this for the final recording session where Henry approves wallet prompts.

## Goals

1. Prove the Mantle app works with a real wallet session.
2. Prove ArcPay can onboard an external agent through CLI/MCP/starter-kit surfaces.
3. Prove policies, x402, RealClaw, privacy, cards, invoices, and audit evidence are connected.
4. Capture evidence without claiming execution before transaction/order proof exists.

## Wallet QA Flow

Use the funded Mantle wallet in the browser.

1. Open https://arcpay-mantle.vercel.app.
2. Click **Open App** or **Sign in**.
3. Connect wallet and approve:
   - network add/switch to Mantle Sepolia/Testnet
   - account connection
   - wallet auth signature
4. Confirm dashboard loads with the wallet address in the top bar.
5. Open `/wallet` and confirm wallet/session state.
6. Open `/app/agents`, load/register `treasury-router` or `research-agent`.
7. Open `/policies`, set conservative limits and allowlist the agent.
8. Open `/realclaw`, generate the RealClaw handoff payload and capture:
   - payload JSON
   - RealClaw agent address if available
   - ArcPay policy and x402 endpoint references
9. Open `/x402`, quote the protected resource, create an order only if budget is acceptable, and capture:
   - x402 quote JSON
   - order transaction hash
   - order ID
   - verification response
10. Open `/privacy`, create a privacy intent only if amount and recipient are safe, and capture commitment/memo evidence.
11. Open `/cards`, delegate a USDY/Mantle card only if token balance/approval is ready.
12. Open `/audit` and confirm wallet/action evidence appears.
13. Open `/status` and confirm live network/API status.

## External Agent Onboarding Flow

### CLI Agent

```powershell
npm install -g @arcpaylabs/mantle-cli
arcpay-mantle wallet
arcpay-mantle realclaw-handoff
arcpay-mantle x402-guide
arcpay-mantle defi-adapters
```

Use the CLI output to configure the agent with:

- ArcPay app: `https://arcpay-mantle.vercel.app`
- x402 gateway: `https://mantle-x402.20.208.46.195.nip.io`
- Agent skills index: `https://arcpay-mantle.vercel.app/.well-known/agent-skills/index.json`
- RealClaw handoff: generated from `/realclaw` or CLI

### MCP Agent

```powershell
npm install -g @arcpaylabs/mantle-mcp
```

Claude Desktop/Codex-style MCP config:

```json
{
  "mcpServers": {
    "arcpay-mantle": {
      "command": "arcpay-mantle-mcp"
    }
  }
}
```

Ask the connected agent:

```text
Use ArcPay Mantle as my treasury policy, RealClaw handoff, and x402 evidence layer.
Call get_deployment, realclaw_handoff, x402_guide, and mantle_defi_adapters.
Prepare a safe plan for an agent called treasury-router.
Do not claim execution without a Mantle tx hash, x402 verification, RealClaw evidence, or ArcPay audit record.
```

### Starter Kit Agent

```powershell
npm install -g @arcpaylabs/mantle-x402-agent-starter
arcpay-mantle-x402-agent quote treasury-router
```

Expected proof:

- Agent client reads x402 payment requirements.
- Returned quote includes payment amount, target order book, protected resource URL, and verification URL.
- Actual order creation still requires wallet signing or an approved agent signer.

## Recording Rule

Do not say "executed" unless the recording shows at least one of:

- Mantle transaction hash
- x402 verification response
- ArcPay order ID with fulfilled/settled state
- RealClaw handoff evidence plus operator confirmation
- ArcPay audit record with source evidence
