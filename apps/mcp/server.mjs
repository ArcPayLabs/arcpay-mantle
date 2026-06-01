#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { id, keccak256, toUtf8Bytes } from "ethers";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const deploymentPath = path.join(root, "deployments", "mantle-testnet.json");
const packagedDeploymentPath = path.join(__dirname, "deployment.json");

function readDeployment() {
  const file = fs.existsSync(deploymentPath) ? deploymentPath : packagedDeploymentPath;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

const server = new McpServer({
  name: "arcpay-mantle",
  version: "0.1.1",
});

const DEFAULT_ZERODEV_PROJECT_ID = "264dd246-2927-4d4e-bcdc-9adbab13d7fd";

server.tool("get_deployment", "Return Mantle testnet contract addresses and network metadata.", {}, async () => ({
  content: [{ type: "text", text: JSON.stringify(readDeployment(), null, 2) }],
}));

server.tool("derive_agent_id", "Derive the bytes32 agent id used by AgentRegistry.", {
  slug: z.string().min(1),
}, async ({ slug }) => ({
  content: [{ type: "text", text: id(slug) }],
}));

server.tool("derive_invoice_id", "Derive the bytes32 invoice id used by AgentInvoiceBook.", {
  publicId: z.string().min(1),
}, async ({ publicId }) => ({
  content: [{ type: "text", text: keccak256(toUtf8Bytes(publicId)) }],
}));

server.tool("derive_claim_hash", "Derive the on-chain claim-code hash for OperatorControls.", {
  code: z.string().min(1),
}, async ({ code }) => ({
  content: [{ type: "text", text: keccak256(toUtf8Bytes(code)) }],
}));

server.tool("derive_privacy_commitment", "Derive a Privacy Intent commitment or nullifier from secret text.", {
  secret: z.string().min(1),
}, async ({ secret }) => ({
  content: [{ type: "text", text: keccak256(toUtf8Bytes(secret)) }],
}));

server.tool("privacy_intent_guide", "Return builder instructions for integrating ArcPay Privacy Intents on Mantle.", {}, async () => {
  const deployment = readDeployment();
  return {
    content: [{
      type: "text",
      text: [
        "ArcPay Privacy Intents for Mantle",
        `Vault: ${deployment.contracts.MantlePrivacyVault}`,
        `USDY: ${deployment.usdyToken}`,
        "commitment = keccak256(secret)",
        "nullifier = keccak256(releaseSecret)",
        "USDY flow: approve vault, then createTokenIntent(commitment, USDY, amount, encryptedMemoUri).",
        "MNT flow: createNativeIntent(commitment, encryptedMemoUri) with msg.value.",
        "Release: releaseIntent(commitment, nullifier, recipient).",
        "Boundary: this hides metadata/recipient during intent phase, not a full shielded pool.",
      ].join("\n"),
    }],
  };
});

server.tool("invoice_guide", "Return builder instructions for ArcPay MNT/USDY invoices on Mantle.", {}, async () => {
  const deployment = readDeployment();
  return {
    content: [{
      type: "text",
      text: [
        "ArcPay Mantle Invoices",
        `InvoiceBook: ${deployment.contracts.AgentInvoiceBook}`,
        `USDY: ${deployment.usdyToken}`,
        "invoiceId = keccak256(publicInvoiceId)",
        "Create MNT invoice: createInvoice(invoiceId, payerOrZero, address(0), amountWei, metadataUri).",
        "Create USDY invoice: createInvoice(invoiceId, payerOrZero, USDY, amountBaseUnits, metadataUri).",
        "Pay MNT: payNativeInvoice(invoiceId) with exact msg.value.",
        "Pay USDY: approve InvoiceBook, then payTokenInvoice(invoiceId).",
        "Cancel unpaid: issuer calls cancelInvoice(invoiceId).",
        "Proof: npm run smoke:live includes on-chain invoice settlement.",
      ].join("\n"),
    }],
  };
});

server.tool("x402_guide", "Return builder instructions for the ArcPay Mantle x402 payment-gated agent server.", {}, async () => {
  const deployment = readDeployment();
  return {
    content: [{
      type: "text",
      text: [
        "ArcPay Mantle x402",
        `OrderBook: ${deployment.contracts.AgentOrderBook}`,
        `Registry: ${deployment.contracts.AgentRegistry}`,
        "Run: npm run x402",
        "Protected resource: GET /agent/:slug/work",
        "No order returns HTTP 402 with exact MNT payment requirements.",
        "Pay by calling AgentOrderBook.createOrder(agentId, requestUri) with quoted msg.value.",
        "Verify: POST /x402/verify with { orderId, agentSlug }.",
        "Unlock: GET /agent/:slug/work?orderId=... after Fulfilled or Settled.",
        "Proof: npm run smoke:x402.",
      ].join("\n"),
    }],
  };
});

server.tool("realclaw_handoff", "Return a RealClaw-ready ArcPay Mantle handoff payload template.", {
  strategyName: z.string().optional(),
  agentSlug: z.string().optional(),
  budgetMnt: z.string().optional(),
}, async ({ strategyName = "arcpay-treasury-cfo", agentSlug = "treasury-router", budgetMnt = "0.05" }) => {
  const deployment = readDeployment();
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        protocol: "arcpay-realclaw-handoff",
        chain: "mantle-testnet",
        chainId: 5003,
        realclawNetwork: "RealClaw Mantle agent, ArcPay Mantle Testnet proof",
        telegramAgent: "configured-inside-realclaw-telegram",
        realclawAgentAddress: "set-after-realclaw-wallet-connection",
        primaryVenue: "Fluxion / Merchant Moe / Agni",
        strategyName,
        agentSlug,
        objective: "Execute only policy-approved Mantle treasury work through ArcPay x402, escrow, privacy, invoice, and USDY card modules.",
        constraints: {
          maxBudgetMnt: budgetMnt,
          allowedAssets: ["MNT", "USDY", "mETH"],
          allowedVenues: ["Fluxion", "Merchant Moe", "Agni Finance"],
          requireArcPayPolicy: true,
          requireOperatorApprovalForLeverage: true,
          requireRegisteredRealClawAgentAddress: true,
          requireVenueEvidence: true,
          noCompletionWithoutTxHashOrOrderEvidence: true,
        },
        endpoints: {
          x402Gateway: "https://mantle-x402.20.208.46.195.nip.io",
          protectedResource: `https://mantle-x402.20.208.46.195.nip.io/agent/${encodeURIComponent(agentSlug)}/work`,
          status: "https://arcpay-mantle.vercel.app/api/status",
          realclawCampaign: "https://openclaw.mantle.xyz/",
        },
        contracts: {
          registry: deployment.contracts.AgentRegistry,
          orderBook: deployment.contracts.AgentOrderBook,
          policy: deployment.contracts.TreasuryPolicy,
          privacyVault: deployment.contracts.MantlePrivacyVault,
          reputation: deployment.contracts.AgentReputationBook,
        },
        setup: [
          "Create and configure the agent inside the RealClaw Telegram bot with Mantle Skills.",
          "Connect the wallet RealClaw registers as the Mantle agent address.",
          "Keep the Telegram bot token and RealClaw secrets in RealClaw, not ArcPay.",
          "Paste this payload into the RealClaw Telegram agent instructions/config.",
          "Use RealClaw for Mantle venue activity across Fluxion, Merchant Moe, and Agni, then attach tx/volume/ROI evidence back into ArcPay.",
        ],
      }, null, 2),
    }],
  };
});

server.tool("mantle_defi_rwa_status", "Return Mantle DeFi/RWA adapter status and evidence requirements.", {}, async () => ({
  content: [{
    type: "text",
    text: JSON.stringify({
      chain: "mantle-testnet",
      chainId: 5003,
      boundary: "Actions complete only after tx, x402 order, signed operator record, or venue evidence exists.",
      venues: [
        { name: "RealClaw / Byreal Skills", state: "handoff-live", evidence: ["registered agent address", "venue response", "transaction hash", "volume/ROI snapshot"] },
        { name: "Merchant Moe", state: "adapter-target", docs: "https://docs.merchantmoe.com/", evidence: ["route quote", "router address", "swap tx", "balances"] },
        { name: "Agni Finance", state: "adapter-target", url: "https://agni.finance/", evidence: ["pool route", "transaction hash", "LP or swap state"] },
        { name: "Fluxion", state: "campaign-evidence", evidence: ["agent address", "venue result", "transaction hash", "risk snapshot"] },
        { name: "USDY / mETH", state: "intent-live", evidence: ["operator approval", "allocation tx", "final balance", "risk memo"] },
      ],
    }, null, 2),
  }],
}));

server.tool("zerodev_status", "Return ZeroDev Mantle Testnet sponsorship setup and required evidence.", {}, async () => {
  const projectId = process.env.ZERODEV_PROJECT_ID || process.env.ZERO_DEV_PROJECT_ID || process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID || DEFAULT_ZERODEV_PROJECT_ID;
  const chainId = process.env.ZERODEV_CHAIN_ID || "5003";
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        chain: "mantle-testnet",
        chainId: Number(chainId),
        configured: Boolean(projectId),
        bundlerRpc: process.env.ZERODEV_BUNDLER_RPC_URL || process.env.ZERODEV_RPC_URL || (projectId ? `https://rpc.zerodev.app/api/v3/${projectId}/chain/${chainId}` : null),
        policyWebhook: process.env.ZERODEV_POLICY_WEBHOOK_URL || "https://arcpay-mantle.vercel.app/api/zerodev/sponsor-policy",
        requiredEvidence: ["userOp hash", "sponsor decision JSON", "transaction hash", "ArcPay policy/audit record"],
      }, null, 2),
    }],
  };
});

server.tool("demo_path", "Return the operator demo path for ArcPay Mantle.", {}, async () => ({
  content: [{
    type: "text",
    text: [
      "Connect an EVM wallet to Mantle Testnet.",
      "Register an agent on /agents.",
      "Set policy and allowlist the agent on /policies.",
      "Create and settle an escrowed agent order on /orders.",
      "Create/redeem claim codes and trigger webhook breaker on /operator.",
      "Request and fulfill risk oracle result on /oracle.",
      "Create and release encrypted Privacy Intents with nullifiers on /privacy.",
      "Create, pay, cancel, and sync MNT/USDY invoices on /invoices.",
      "Show /audit and /proofs.",
    ].join("\n"),
  }],
}));

server.tool("smoke_commands", "Return the verification commands operators can run locally and against Mantle testnet.", {}, async () => ({
  content: [{
    type: "text",
    text: [
      "npm run build:frontend",
      "npm test",
      "npm run check:worker",
      "npm run check:x402",
      "npm run smoke:auth",
      "npm run smoke:live",
      "npm run smoke:x402",
    ].join("\n"),
  }],
}));

const transport = new StdioServerTransport();
await server.connect(transport);
