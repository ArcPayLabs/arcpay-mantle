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
    description: "Return integration steps for MNT and USDY invoices.",
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
        `USDY: ${deployment.usdyToken}`,
        "1. commitment = keccak256(secret).",
        "2. For MNT, call createNativeIntent(commitment, encryptedMemoUri) with msg.value.",
        "3. For USDY, approve the vault and call createTokenIntent(commitment, USDY, amount, encryptedMemoUri).",
        "4. Release with releaseIntent(commitment, nullifier, recipient).",
        "5. Cancellation refunds unreleased intents to the operator.",
        "Boundary: this hides metadata and recipient until release; it is not a full shielded pool.",
      ].join("\n"));
    case "invoice_guide":
      return text([
        "ArcPay Mantle Invoices",
        `InvoiceBook: ${deployment.contracts.AgentInvoiceBook}`,
        `USDY: ${deployment.usdyToken}`,
        "1. invoiceId = keccak256(publicInvoiceId).",
        "2. Create MNT invoices with token address(0) and amountWei.",
        "3. Create USDY invoices with the USDY token address and base-unit amount.",
        "4. Pay MNT with payNativeInvoice(invoiceId) and exact msg.value.",
        "5. Pay USDY by approving InvoiceBook, then calling payTokenInvoice(invoiceId).",
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
        realclawNetwork: "RealClaw mainnet bot, ArcPay Mantle Testnet proof",
        telegramAgent: "configured-inside-realclaw-telegram",
        strategyName,
        agentSlug,
        objective: "Execute only policy-approved Mantle treasury work through ArcPay x402, escrow, privacy, invoice, and USDY card modules.",
        constraints: {
          maxBudgetMnt: budgetMnt,
          allowedAssets: ["MNT", "USDY", "mETH"],
          requireArcPayPolicy: true,
          requireOperatorApprovalForLeverage: true,
          noCompletionWithoutTxHashOrOrderEvidence: true,
        },
        endpoints: {
          x402Gateway: "https://mantle-x402.20.208.46.195.nip.io",
          protectedResource: `https://mantle-x402.20.208.46.195.nip.io/agent/${encodeURIComponent(agentSlug)}/work`,
          status: "https://arcpay-mantle.vercel.app/api/status",
        },
        contracts: {
          registry: deployment.contracts.AgentRegistry,
          orderBook: deployment.contracts.AgentOrderBook,
          policy: deployment.contracts.TreasuryPolicy,
          privacyVault: deployment.contracts.MantlePrivacyVault,
          reputation: deployment.contracts.AgentReputationBook,
        },
        setup: [
          "Create and configure the agent inside the RealClaw Telegram bot.",
          "Keep the Telegram bot token and RealClaw secrets in RealClaw, not ArcPay.",
          "Paste this payload into the RealClaw Telegram agent instructions/config.",
          "Use ArcPay as the Mantle Testnet policy, x402, contract, and audit proof layer.",
        ],
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
