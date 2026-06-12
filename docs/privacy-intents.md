# ArcPay Privacy Intents

ArcPay Privacy Intents are a lightweight treasury privacy primitive for Mantle
agents.

They are designed for:

- confidential contractor payouts
- hidden invoice settlement
- delayed recipient disclosure
- agent-to-agent payment intents with encrypted business metadata
- early apps that need privacy without building a full shielded pool

## Live Contracts

| Resource | Address |
| --- | --- |
| `MantlePrivacyVault` | `0x717CB18B08bE0c2ce1c897d879025c4a90861c20` |
| `ArcPayTestCredit` | `0xda41b9EB708d32b29F4d90468298c69824A15E5C` |

## Privacy Boundary

This is not a ZK mixer and does not make final transfers invisible. It provides
application-level treasury privacy:

- commitment IDs instead of plain business IDs
- encrypted memo URI instead of public invoice/contractor metadata
- recipient hidden until release
- one-time release through a nullifier
- cancellation/refund while unreleased
- release proof via nullifier so the same intent cannot be released twice

## Solidity Interface

```solidity
function createNativeIntent(bytes32 commitment, string calldata encryptedMemoUri) external payable;
function createTokenIntent(bytes32 commitment, address token, uint256 amount, string calldata encryptedMemoUri) external;
function releaseIntent(bytes32 commitment, bytes32 nullifier, address payable recipient) external;
function cancelIntent(bytes32 commitment) external;
```

## ArcPay Test-Credit Flow

```ts
import { Contract, keccak256, toUtf8Bytes } from "ethers";

const commitment = keccak256(toUtf8Bytes("invoice-42-secret"));
const nullifier = keccak256(toUtf8Bytes("release-secret-42"));

await testCredit.approve(privacyVaultAddress, amount);
await privacyVault.createTokenIntent(
  commitment,
  testCreditAddress,
  amount,
  "encrypted://your-ciphertext-or-ipfs-pointer",
);

await privacyVault.releaseIntent(commitment, nullifier, recipient);
```

## Native MNT Flow

```ts
const commitment = keccak256(toUtf8Bytes("payout-42-secret"));
const nullifier = keccak256(toUtf8Bytes("release-secret-42"));

await privacyVault.createNativeIntent(
  commitment,
  "encrypted://your-ciphertext-or-ipfs-pointer",
  { value: parseEther("0.01") },
);

await privacyVault.releaseIntent(commitment, nullifier, recipient);
```

## Smoke Proof

The funded smoke test creates and releases a native privacy intent on Mantle
testnet:

```bash
npm run smoke:live
```

## CLI Helpers

Published CLI:

```bash
npm install -g @arcpaylabs/mantle-cli
arcpay-mantle privacy-commit "invoice-42-secret"
arcpay-mantle privacy-abi
arcpay-mantle privacy-guide
```

Repo-local CLI:

```bash
npm run arcpay -- privacy-commit "invoice-42-secret"
npm run arcpay -- privacy-abi
npm run arcpay -- privacy-guide
```

## MCP Tools

The ArcPay Mantle MCP server exposes:

- `derive_privacy_commitment`
- `privacy_intent_guide`

Run:

```bash
npm install -g @arcpaylabs/mantle-mcp
arcpay-mantle-mcp
```

Or run from the repo:

```bash
npm run mcp
```
