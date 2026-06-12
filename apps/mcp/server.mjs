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
        "Read orderId from the OrderCreated event in the createOrder transaction receipt.",
        "Verify: POST /x402/verify with { orderId, agentSlug }.",
        "Unlock: GET /agent/:slug/work?orderId=... after Fulfilled or Settled.",
        "Proof: npm run smoke:x402.",
      ].join("\n"),
    }],
  };
});

server.tool("order_id_guide", "Explain how ArcPay order ids are produced, found, and reused across x402/order/audit flows.", {
  agentSlug: z.string().optional(),
}, async ({ agentSlug = "research-agent" }) => {
  const deployment = readDeployment();
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        chain: "mantle-testnet",
        chainId: 5003,
        orderBook: deployment.contracts.AgentOrderBook,
        agentSlug,
        agentId: id(agentSlug),
        createCall: "AgentOrderBook.createOrder(bytes32 agentId, string requestUri) payable",
        generatedOnChain: "keccak256(abi.encodePacked(block.chainid, address(orderBook), requester, agentId, orderNonce))",
        sourceOfTruth: "OrderCreated(orderId, agentId, requester, provider, amountWei, requestUri) event in the tx receipt",
        useOrderIdFor: ["/orders load", "/x402 verify", "/agent/:slug/work?orderId=...", "/oracle risk request", "/reputation review", "/audit evidence"],
        testCommands: [
          `curl https://mantle-x402.20.208.46.195.nip.io/x402/verify -H "content-type: application/json" -d "{\\"orderId\\":\\"0x...\\",\\"agentSlug\\":\\"${agentSlug}\\"}"`,
          `curl "https://mantle-x402.20.208.46.195.nip.io/agent/${agentSlug}/work?orderId=0x..."`,
        ],
      }, null, 2),
    }],
  };
});

server.tool("agent_onboarding_payload", "Generate a bring-your-own-agent onboarding payload for ArcPay Mantle.", {
  slug: z.string().min(1),
  endpoint: z.string().url().optional(),
  priceMnt: z.string().optional(),
}, async ({ slug, endpoint, priceMnt = "0.001" }) => {
  const deployment = readDeployment();
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        protocol: "arcpay-mantle-agent-onboarding",
        network: deployment.network,
        chainId: deployment.chainId,
        agentSlug: slug,
        agentId: id(slug),
        endpoint: endpoint ?? `https://mantle-x402.20.208.46.195.nip.io/agent/${slug}/work`,
        priceMnt,
        contracts: {
          registry: deployment.contracts.AgentRegistry,
          orderBook: deployment.contracts.AgentOrderBook,
          policy: deployment.contracts.TreasuryPolicy,
          operatorControls: deployment.contracts.OperatorControls,
          spendCardVault: deployment.contracts.AgentSpendCardVault,
          reputation: deployment.contracts.AgentReputationBook,
        },
        nextSteps: [
          "Register the slug/capabilities on AgentRegistry.",
          "Create or redeem a claim code in OperatorControls if the agent is external.",
          "Attach workspace policy and optional per-agent limits.",
          "Quote x402, create escrowed order, verify/fulfill, then record audit evidence.",
        ],
      }, null, 2),
    }],
  };
});

server.tool("usdy_card_plan", "Generate a USDY spend-card setup plan for a Mantle agent.", {
  slug: z.string().min(1),
  agentWallet: z.string().optional(),
  limitUsdy: z.string().optional(),
}, async ({ slug, agentWallet = "<agent-wallet-address>", limitUsdy = "5" }) => {
  const deployment = readDeployment();
  const cardSlug = `${slug}-usdy-card`;
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        protocol: "arcpay-mantle-usdy-card",
        network: deployment.network,
        chainId: deployment.chainId,
        cardSlug,
        cardId: keccak256(toUtf8Bytes(cardSlug)),
        agentWallet,
        limitUsdy,
        contracts: {
          spendCardVault: deployment.contracts.AgentSpendCardVault,
          usdy: deployment.usdyToken,
        },
        calls: [
          "USDY.approve(AgentSpendCardVault, amountBaseUnits)",
          "AgentSpendCardVault.createCard(cardId, agentWallet, USDY, limitBaseUnits, label)",
          "AgentSpendCardVault.topUpCard(cardId, amountBaseUnits)",
          "AgentSpendCardVault.setCardStatus(cardId, true|false)",
          "AgentSpendCardVault.spendCard(cardId, recipient, amountBaseUnits, memo) by assigned agent",
        ],
        proofRequired: ["cardId", "createCard tx hash", "approve tx hash", "topUpCard tx hash", "cards(cardId) state", "spend tx hash if used"],
      }, null, 2),
    }],
  };
});

server.tool("policy_plan", "Generate global workspace and per-agent policy requirements for ArcPay Mantle execution.", {
  slug: z.string().min(1),
  dailyLimit: z.string().optional(),
}, async ({ slug, dailyLimit = "10" }) => ({
  content: [{
    type: "text",
    text: JSON.stringify({
      protocol: "arcpay-mantle-policy-plan",
      agentSlug: slug,
      agentId: id(slug),
      workspacePolicy: {
        scope: "Global workspace controls",
        enforcedAcross: ["payments", "orders", "x402", "cards", "invoices", "privacy", "RealClaw", "DeFi/RWA intents"],
        checks: ["wallet required", "treasury pause", "allowed token", "allowed network", "risk floor", "per-transaction max", "daily max"],
      },
      agentPolicy: {
        scope: "Per-agent controls",
        dailyLimitMntOrUsdy: dailyLimit,
        allowedActions: ["x402 work", "escrow order", "USDY card spend", "RealClaw handoff", "RWA intent"],
        evidenceRequired: ["tx hash", "x402 verification", "ArcPay order id", "RealClaw/venue evidence when applicable"],
      },
    }, null, 2),
  }],
}));

server.tool("evidence_template", "Return the audit evidence checklist ArcPay Mantle requires before an agent can claim completion.", {
  slug: z.string().optional(),
}, async ({ slug = "treasury-router" }) => ({
  content: [{
    type: "text",
    text: [
      `Agent: ${slug}`,
      "Wallet address and chain id 5003.",
      "Agent slug, agent id, registered endpoint, and capability metadata.",
      "Policy snapshot: global workspace policy plus per-agent limits.",
      "x402 quote response: HTTP status, payment requirements, request URI, amount.",
      "Order evidence: createOrder tx hash, order id, state before/after fulfill, settle/refund tx.",
      "Card evidence: card id, approve/top-up tx, card state, spend tx if used.",
      "Privacy evidence: commitment, encrypted memo URI, create/release tx, nullifier.",
      "Invoice evidence: invoice id, create/pay/cancel tx, payer and token state.",
      "RealClaw/Byreal evidence: agent address, venue response, transaction hash, volume/ROI snapshot.",
      "Audit page screenshot and Mantlescan links for every tx hash.",
    ].join("\n"),
  }],
}));

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
        primaryVenue: "ArcPay Testnet contracts; partner venues require returned evidence",
        strategyName,
        agentSlug,
        objective: "Execute only policy-approved Mantle Testnet treasury work through ArcPay x402, escrow, privacy, invoice, and card modules.",
        constraints: {
          maxBudgetMnt: budgetMnt,
          allowedAssets: ["MNT", "WMNT"],
          liveTestnetVenues: ["ArcPay contracts"],
          mainnetReferenceOnlyVenues: ["Fluxion", "Merchant Moe", "Agni Finance", "Aave V3", "USDY", "mETH"],
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
          "Do not mark Merchant Moe, Agni, Fluxion, Aave, USDY, or mETH as Mantle Sepolia live unless official testnet contracts are supplied.",
          "If RealClaw produces venue activity, attach tx/volume/ROI evidence back into ArcPay before claiming completion.",
        ],
      }, null, 2),
    }],
  };
});

server.tool("mantle_defi_rwa_status", "Return Mantle DeFi/RWA adapter status and evidence requirements.", {}, async () => {
  const deployment = readDeployment();
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
      chain: "mantle-testnet",
      chainId: 5003,
      boundary: "ArcPay vault swap/yield actions are wallet-signed on Mantle Testnet. Official @mantleio/mantle-core Sepolia protocol registry is empty; partner DEX/RWA venues are not testnet-live.",
      packageAudit: {
        package: "@mantleio/mantle-core@0.1.19",
        sepoliaProtocols: "empty",
        sepoliaTokens: ["MNT", "WMNT"],
      },
      liveVault: {
        address: deployment.contracts.ArcPayMantleDeFiVault,
        swap: "swapNativeToToken(recipient, routeUri) payable",
        yield: "depositNativeYield(strategyUri) payable / withdrawNativeYield(amount, recipient)",
        proof: "/proofs/mantle-defi-vault-live-proof.json",
      },
      venues: [
        { name: "ArcPay Mantle DeFi Vault", state: "live-wallet-signed", evidence: ["swap tx", "yield deposit tx", "vault position"] },
        { name: "RealClaw / Byreal", state: "handoff-evidence-only", evidence: ["registered agent address", "venue response", "transaction hash", "volume/ROI snapshot"] },
        { name: "Merchant Moe", state: "not-testnet-live", docs: "https://docs.merchantmoe.com/", reason: "mainnet contracts only in @mantleio/mantle-core" },
        { name: "Agni Finance", state: "not-testnet-live", reason: "mainnet contracts only in @mantleio/mantle-core" },
        { name: "Fluxion", state: "not-testnet-live", reason: "mainnet contracts only in @mantleio/mantle-core" },
        { name: "USDY / mETH", state: "not-testnet-live", reason: "Sepolia token registry only exposes MNT and WMNT" },
      ],
    }, null, 2),
    }],
  };
});

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
