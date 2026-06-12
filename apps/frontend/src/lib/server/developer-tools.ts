import { id, keccak256, toUtf8Bytes } from "ethers";
import deployment from "../../../../../deployments/mantle-testnet.json";

type ToolResult = {
  contentType: "application/json" | "text/plain";
  body: unknown;
};

type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
};

const network = {
  name: "Mantle Testnet",
  chainId: 5003,
  rpcUrl: "https://rpc.sepolia.mantle.xyz",
  explorerUrl: "https://sepolia.mantlescan.xyz",
  currency: "MNT",
};

const mantleDefiRwaVenues = [
  {
    name: "RealClaw / Byreal Skills",
    category: "agent-executor",
    state: "handoff-evidence-only",
    execution: "operator-configured Telegram agent returns venue evidence; ArcPay does not mark partner venue execution complete without tx/evidence",
    evidence: ["registered agent address", "venue response", "transaction hash", "volume/ROI snapshot"],
  },
  {
    name: "Merchant Moe",
    category: "dex-router",
    state: "mainnet-reference",
    execution: "not marked as Mantle Sepolia live; official Mantle package exposes no Sepolia protocol registry entry",
    docs: "https://docs.merchantmoe.com/",
    evidence: ["route quote", "router address", "swap transaction hash", "before/after balance"],
  },
  {
    name: "Agni Finance",
    category: "dex-liquidity",
    state: "testnet-contracts-discovered",
    execution: "Mantle Sepolia contracts have bytecode; require route quote, signed tx, and before/after balances before marking complete",
    url: "https://agni.finance/",
    contracts: {
      factory: "0xA9AcD50B042A72c33d05fDcC8ad209d3aD361762",
      swapRouter: "0xe38cfa32cCd918d94E2e20230dFaD1A4Fd8aEF16",
      quoter: "0xA82F8dC4704d3512b120de70480219761F24B6Eb",
      quoterV2: "0x9Da17239a4170f50A5A2c11813BD0C601b5c9693",
      wmnt: "0x67A1f4A939b477A6b7c5BF94D97E45dE87E608eF",
    },
    evidence: ["pool route", "transaction hash", "LP or swap state"],
  },
  {
    name: "Fluxion",
    category: "realclaw-venue",
    state: "mainnet-reference",
    execution: "RealClaw/venue evidence only unless the operator provides a Mantle tx or venue proof",
    evidence: ["agent address", "venue result", "transaction hash", "risk snapshot"],
  },
  {
    name: "USDY / mETH",
    category: "rwa-yield",
    state: "mainnet-reference",
    execution: "not marked as Mantle Sepolia live; Sepolia registry currently exposes MNT/WMNT only",
    evidence: ["operator approval", "allocation tx", "final balance", "risk memo"],
  },
];

const DEFAULT_ZERODEV_PROJECT_ID = "264dd246-2927-4d4e-bcdc-9adbab13d7fd";

export const developerTools: ToolDefinition[] = [
  {
    name: "get_deployment",
    description: "Return ArcPay Mantle deployment metadata and contract addresses.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "derive_agent_id",
    description: "Derive the bytes32 agent id used by AgentRegistry.",
    inputSchema: { type: "object", required: ["slug"], properties: { slug: { type: "string" } } },
  },
  {
    name: "derive_invoice_id",
    description: "Derive the bytes32 invoice id used by AgentInvoiceBook.",
    inputSchema: { type: "object", required: ["publicId"], properties: { publicId: { type: "string" } } },
  },
  {
    name: "derive_claim_hash",
    description: "Derive the claim-code hash used by OperatorControls.",
    inputSchema: { type: "object", required: ["code"], properties: { code: { type: "string" } } },
  },
  {
    name: "derive_privacy_commitment",
    description: "Derive a Privacy Intent commitment or nullifier from secret text.",
    inputSchema: { type: "object", required: ["secret"], properties: { secret: { type: "string" } } },
  },
  {
    name: "privacy_intent_guide",
    description: "Return integration steps for ArcPay Privacy Intents.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "invoice_guide",
    description: "Return integration steps for MNT and ArcPay test-credit invoices.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "x402_guide",
    description: "Return integration steps for x402 paid agent endpoints.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "realclaw_handoff",
    description: "Return a RealClaw-ready ArcPay Mantle handoff payload template.",
    inputSchema: {
      type: "object",
      properties: {
        strategyName: { type: "string" },
        agentSlug: { type: "string" },
        budgetMnt: { type: "string" },
      },
    },
  },
  {
    name: "mantle_defi_rwa_status",
    description: "Return Mantle DeFi/RWA adapter status and required evidence, including which venues are mainnet/reference-only instead of Sepolia live.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "zerodev_status",
    description: "Return the ZeroDev Mantle Testnet configuration and required sponsored UserOp evidence.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "starter_kit",
    description: "Return the recommended starter-kit files for a Mantle x402 agent.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "roadmap",
    description: "Return the ArcPay Mantle product roadmap.",
    inputSchema: { type: "object", properties: {} },
  },
];

export async function runDeveloperTool(name: string, args: Record<string, unknown> = {}): Promise<ToolResult> {
  switch (name) {
    case "get_deployment":
      return json({ network, deployment });
    case "derive_agent_id":
      return text(id(requiredString(args.slug, "slug")));
    case "derive_invoice_id":
      return text(keccak256(toUtf8Bytes(requiredString(args.publicId, "publicId"))));
    case "derive_claim_hash":
      return text(keccak256(toUtf8Bytes(requiredString(args.code, "code"))));
    case "derive_privacy_commitment":
      return text(keccak256(toUtf8Bytes(requiredString(args.secret, "secret"))));
    case "privacy_intent_guide":
      return text([
        "ArcPay Privacy Intents",
        `Vault: ${deployment.contracts.MantlePrivacyVault}`,
        `ArcPay Test Credit: ${deployment.usdyToken}`,
        "1. commitment = keccak256(secret).",
        "2. For MNT, call createNativeIntent(commitment, encryptedMemoUri) with msg.value.",
        "3. For ArcPay Test Credit, approve the vault and call createTokenIntent(commitment, token, amount, encryptedMemoUri).",
        "4. Release with releaseIntent(commitment, nullifier, recipient).",
        "5. Cancellation refunds unreleased intents to the operator.",
        "Boundary: this hides metadata and recipient until release; it is not a full shielded pool.",
      ].join("\n"));
    case "invoice_guide":
      return text([
        "ArcPay Mantle Invoices",
        `InvoiceBook: ${deployment.contracts.AgentInvoiceBook}`,
        `ArcPay Test Credit: ${deployment.usdyToken}`,
        "1. invoiceId = keccak256(publicInvoiceId).",
        "2. Create MNT invoices with token address(0) and amountWei.",
        "3. Create ArcPay Test Credit invoices with the token address and base-unit amount.",
        "4. Pay MNT with payNativeInvoice(invoiceId) and exact msg.value.",
        "5. Pay test-credit invoices by approving InvoiceBook, then calling payTokenInvoice(invoiceId).",
      ].join("\n"));
    case "x402_guide":
      return text([
        "ArcPay Mantle x402",
        "Server: https://mantle-x402.20.208.46.195.nip.io",
        `Registry: ${deployment.contracts.AgentRegistry}`,
        `OrderBook: ${deployment.contracts.AgentOrderBook}`,
        "1. Register an agent slug in AgentRegistry.",
        "2. GET /agent/:slug/work returns HTTP 402 with exact MNT payment requirements.",
        "3. Payer calls AgentOrderBook.createOrder(agentId, requestUri) with quoted msg.value.",
        "4. Provider fulfills the order.",
        "5. GET /agent/:slug/work?orderId=... unlocks after Fulfilled or Settled.",
      ].join("\n"));
    case "realclaw_handoff": {
      const strategyName = String(args.strategyName ?? "arcpay-treasury-cfo");
      const agentSlug = String(args.agentSlug ?? "treasury-router");
      const budgetMnt = String(args.budgetMnt ?? "0.05");
      return json({
        protocol: "arcpay-realclaw-handoff",
        chain: "mantle-testnet",
        chainId: 5003,
        realclawNetwork: "RealClaw Mantle agent, ArcPay Mantle Testnet proof",
        telegramAgent: "configured-inside-realclaw-telegram",
        realclawAgentAddress: "set-after-realclaw-wallet-connection",
        primaryVenue: "ArcPay Testnet contracts; RealClaw/Byreal evidence handoff",
        strategyName,
        agentSlug,
        objective: "Execute only policy-approved Mantle treasury work through ArcPay x402, escrow, privacy, invoice, and test-credit card modules.",
        constraints: {
          maxBudgetMnt: budgetMnt,
          allowedAssets: ["MNT", "WMNT", "ArcPay Test Credit"],
          mainnetReferenceOnlyAssets: ["USDY", "mETH"],
          testnetContractVenues: ["Agni Finance"],
          mainnetReferenceOnlyVenues: ["Fluxion", "Merchant Moe"],
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
          realclawCampaign: "https://www.byreal.io/en/realclaw",
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
          "Use ArcPay for Mantle Sepolia policy/x402/escrow/privacy/invoice/card evidence. Attach RealClaw or partner tx/volume/ROI evidence only when a real venue action exists.",
        ],
      });
    }
    case "mantle_defi_rwa_status":
      return json({
        network,
        venues: mantleDefiRwaVenues,
        policy: [
          "No route, RWA, or RealClaw action may be marked complete without a transaction hash, x402 verification, signed operator record, or venue response.",
          "All intents must include asset, amount, slippage or risk limit, executor, expiry, and before/after balance evidence.",
          "Agni Sepolia contracts are configured, but Agni actions still require real quote/tx/balance evidence before completion.",
          "Merchant Moe, Fluxion, USDY, mETH, and Aave are not marked as Mantle Sepolia live unless official testnet contracts are provided.",
          "RealClaw flows must include the registered agent address and keep Telegram bot secrets outside ArcPay.",
        ],
      });
    case "zerodev_status": {
      const projectId = process.env.ZERODEV_PROJECT_ID ?? process.env.ZERO_DEV_PROJECT_ID ?? process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID ?? DEFAULT_ZERODEV_PROJECT_ID;
      const chainId = Number(process.env.ZERODEV_CHAIN_ID ?? 5003);
      return json({
        network,
        configured: Boolean(projectId),
        chainId,
        bundlerRpc: process.env.ZERODEV_BUNDLER_RPC_URL ?? process.env.ZERODEV_RPC_URL ?? (projectId ? `https://rpc.zerodev.app/api/v3/${projectId}/chain/${chainId}` : null),
        policyWebhook: process.env.ZERODEV_POLICY_WEBHOOK_URL ?? "https://arcpay-mantle.vercel.app/api/zerodev/sponsor-policy",
        requiredEvidence: ["userOp hash", "sponsor decision JSON", "transaction hash", "ArcPay policy/audit record"],
      });
    }
    case "starter_kit":
      return json({
        files: [
          "starter-kits/mantle-x402-agent/README.md",
          "starter-kits/mantle-x402-agent/package.json",
          "starter-kits/mantle-x402-agent/src/agent-client.mjs",
          "starter-kits/mantle-x402-agent/src/env.example",
        ],
        commands: [
          "npm install",
          "cp src/env.example .env",
          "node src/agent-client.mjs quote research-agent",
        ],
      });
    case "roadmap":
      return json({
        phases: [
          "Deploy Mintlify and keep /openapi.json + /llms.txt public.",
          "Publish Mantle x402 starter kit and privacy-intent examples.",
          "Operate the hosted MCP-style JSON-RPC bridge with auth and rate limits.",
          "Expand agent discovery with reputation and service analytics.",
          "Package the Mantle x402 gateway, privacy intents, and policy controls as reusable builder infrastructure.",
        ],
      });
    default:
      throw new Error(`Unknown developer tool: ${name}`);
  }
}

function requiredString(value: unknown, key: string) {
  const text = String(value ?? "").trim();
  if (!text) throw new Error(`${key} is required`);
  return text;
}

function json(body: unknown): ToolResult {
  return { contentType: "application/json", body };
}

function text(body: string): ToolResult {
  return { contentType: "text/plain", body };
}
