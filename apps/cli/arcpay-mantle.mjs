#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { id, keccak256, toUtf8Bytes } from "ethers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoDeploymentPath = path.join(process.cwd(), "deployments", "mantle-testnet.json");
const packageDeploymentPath = path.join(__dirname, "deployment.json");

function deployment() {
  const file = fs.existsSync(repoDeploymentPath) ? repoDeploymentPath : packageDeploymentPath;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function usage() {
  console.log(`ArcPay Mantle CLI

Commands:
  arcpay-mantle contracts              Print deployed Mantle addresses
  arcpay-mantle wallet                 Print network wallet instructions
  arcpay-mantle agent-id <slug>        Derive bytes32 agent id
  arcpay-mantle invoice-id <publicId>  Derive bytes32 invoice id
  arcpay-mantle claim-hash <code>      Derive claim-code hash
  arcpay-mantle privacy-commit <text>  Derive Privacy Intent commitment/nullifier
  arcpay-mantle privacy-abi            Print Privacy Intent contract ABI
  arcpay-mantle privacy-guide          Print builder integration guide
  arcpay-mantle invoice-guide          Print invoice settlement guide
  arcpay-mantle x402-guide             Print x402 HTTP payment gate guide
  arcpay-mantle order-id-guide         Explain how to obtain and test order ids
  arcpay-mantle onboard-agent <slug>   Print BYO-agent onboarding payload
  arcpay-mantle card-guide <slug>      Print USDY card setup plan
  arcpay-mantle policy-guide <slug>    Print workspace + per-agent policy plan
  arcpay-mantle evidence-template      Print audit evidence checklist
  arcpay-mantle realclaw-handoff       Print RealClaw handoff payload template
  arcpay-mantle defi-status            Print Mantle DeFi/RWA adapter and evidence status
  arcpay-mantle zerodev-status         Print ZeroDev Mantle sponsorship setup
  arcpay-mantle demo-path              Print operator demo steps
  arcpay-mantle smoke                  Print smoke-test commands
  arcpay-mantle mcp-config             Print MCP host config
`);
}

const [, , command, ...args] = process.argv;
const DEFAULT_ZERODEV_PROJECT_ID = "264dd246-2927-4d4e-bcdc-9adbab13d7fd";

try {
  if (!command || command === "help" || command === "--help") {
    usage();
  } else if (command === "contracts") {
    console.log(JSON.stringify(deployment().contracts, null, 2));
  } else if (command === "wallet") {
    console.log("Add Mantle Testnet to an EVM wallet:");
    console.log("Chain ID: 5003 / 0x138b");
    console.log("RPC: https://rpc.sepolia.mantle.xyz");
    console.log("Currency: MNT");
    console.log("Explorer: https://sepolia.mantlescan.xyz");
  } else if (command === "agent-id") {
    console.log(id(args.join(" ") || "agent"));
  } else if (command === "invoice-id") {
    console.log(keccak256(toUtf8Bytes(args.join(" ") || "invoice")));
  } else if (command === "claim-hash") {
    console.log(keccak256(toUtf8Bytes(args.join(" "))));
  } else if (command === "privacy-commit") {
    console.log(keccak256(toUtf8Bytes(args.join(" "))));
  } else if (command === "privacy-abi") {
    console.log(JSON.stringify([
      "function createNativeIntent(bytes32 commitment,string encryptedMemoUri) payable",
      "function createTokenIntent(bytes32 commitment,address token,uint256 amount,string encryptedMemoUri)",
      "function releaseIntent(bytes32 commitment,bytes32 nullifier,address recipient)",
      "function cancelIntent(bytes32 commitment)",
      "function intents(bytes32 commitment) view returns (address operator,address token,uint256 amount,string encryptedMemoUri,bool released,bool cancelled,uint256 createdAt)",
    ], null, 2));
  } else if (command === "privacy-guide") {
    const info = deployment();
    console.log([
      "ArcPay Privacy Intents for Mantle",
      "",
      `Vault: ${info.contracts.MantlePrivacyVault}`,
      `USDY: ${info.usdyToken}`,
      "",
      "1. commitment = keccak256(secret)",
      "2. nullifier = keccak256(releaseSecret)",
      "3. approve USDY to the vault for token intents",
      "4. call createTokenIntent(commitment, USDY, amount, encryptedMemoUri)",
      "5. later call releaseIntent(commitment, nullifier, recipient)",
      "",
      "Privacy boundary: metadata and recipient are hidden during intent phase; release transfer is public.",
    ].join("\n"));
  } else if (command === "invoice-guide") {
    const info = deployment();
    console.log([
      "ArcPay Mantle Invoices",
      "",
      `InvoiceBook: ${info.contracts.AgentInvoiceBook}`,
      `USDY: ${info.usdyToken}`,
      "",
      "1. invoiceId = keccak256(publicInvoiceId).",
      "2. MNT invoice: createInvoice(invoiceId, payerOrZero, address(0), amountWei, metadataUri).",
      "3. USDY invoice: createInvoice(invoiceId, payerOrZero, USDY, amountBaseUnits, metadataUri).",
      "4. Payer signs payNativeInvoice(invoiceId) with exact msg.value or approves USDY then payTokenInvoice(invoiceId).",
      "5. Issuer can cancel unpaid invoices with cancelInvoice(invoiceId).",
      "",
      "Proof command: npm run smoke:live",
    ].join("\n"));
  } else if (command === "x402-guide") {
    const info = deployment();
    console.log([
      "ArcPay Mantle x402",
      "",
      `Registry: ${info.contracts.AgentRegistry}`,
      `OrderBook: ${info.contracts.AgentOrderBook}`,
      "",
      "1. Register an agent slug in AgentRegistry.",
      "2. GET https://mantle-x402.20.208.46.195.nip.io/agent/:slug/work returns HTTP 402 requirements.",
      "3. Payer calls AgentOrderBook.createOrder(agentId, requestUri) with quoted msg.value.",
      "4. Read orderId from the OrderCreated event in the transaction receipt.",
      "5. Provider fulfills the order.",
      "6. GET /agent/:slug/work?orderId=... unlocks only after Fulfilled or Settled.",
      "",
      "Proof command: npm run smoke:x402",
    ].join("\n"));
  } else if (command === "order-id-guide") {
    const info = deployment();
    console.log([
      "ArcPay Mantle order id guide",
      "",
      `OrderBook: ${info.contracts.AgentOrderBook}`,
      "Function: createOrder(bytes32 agentId, string requestUri) payable returns (bytes32 orderId)",
      "",
      "How the id is generated on-chain:",
      "orderId = keccak256(abi.encodePacked(block.chainid, address(orderBook), requester, agentId, orderNonce))",
      "",
      "How to get it in the app:",
      "1. Quote x402 or open /orders.",
      "2. Sign createOrder in the wallet.",
      "3. Wait for the tx receipt.",
      "4. Parse the OrderCreated(orderId, agentId, requester, provider, amountWei, requestUri) event.",
      "5. Paste that orderId into /x402, /orders, /oracle, /reputation, or /audit.",
      "",
      "How to test it:",
      "curl https://mantle-x402.20.208.46.195.nip.io/x402/verify -H \"content-type: application/json\" -d \"{\\\"orderId\\\":\\\"0x...\\\",\\\"agentSlug\\\":\\\"research-agent\\\"}\"",
      "curl \"https://mantle-x402.20.208.46.195.nip.io/agent/research-agent/work?orderId=0x...\"",
    ].join("\n"));
  } else if (command === "onboard-agent") {
    const info = deployment();
    const slug = args[0] || "treasury-router";
    const endpoint = args[1] || `https://mantle-x402.20.208.46.195.nip.io/agent/${slug}/work`;
    const priceMnt = args[2] || "0.001";
    console.log(JSON.stringify({
      protocol: "arcpay-mantle-agent-onboarding",
      network: info.network,
      chainId: info.chainId,
      agentSlug: slug,
      agentId: id(slug),
      endpoint,
      priceMnt,
      contracts: {
        registry: info.contracts.AgentRegistry,
        orderBook: info.contracts.AgentOrderBook,
        policy: info.contracts.TreasuryPolicy,
        operatorControls: info.contracts.OperatorControls,
        spendCardVault: info.contracts.AgentSpendCardVault,
        reputation: info.contracts.AgentReputationBook,
      },
      dashboardPath: "https://arcpay-mantle.vercel.app/app/agents",
      nextSteps: [
        "Register the slug/capabilities on AgentRegistry.",
        "Create or redeem a claim code in OperatorControls if the agent is external.",
        "Attach workspace policy and optional per-agent allowlist/limits.",
        "Quote the x402 endpoint, create an escrowed order, verify/fulfill, then record evidence in Audit.",
      ],
    }, null, 2));
  } else if (command === "card-guide") {
    const info = deployment();
    const slug = args[0] || "treasury-router";
    const agent = args[1] || "<agent-wallet-address>";
    const limit = args[2] || "5";
    const cardSlug = `${slug}-usdy-card`;
    console.log(JSON.stringify({
      protocol: "arcpay-mantle-usdy-card",
      network: info.network,
      chainId: info.chainId,
      cardSlug,
      cardId: keccak256(toUtf8Bytes(cardSlug)),
      agent,
      limitUsdy: limit,
      contracts: {
        spendCardVault: info.contracts.AgentSpendCardVault,
        usdy: info.usdyToken,
      },
      calls: [
        "USDY.approve(AgentSpendCardVault, amountBaseUnits)",
        "AgentSpendCardVault.createCard(cardId, agent, USDY, limitBaseUnits, label)",
        "AgentSpendCardVault.topUpCard(cardId, amountBaseUnits)",
        "AgentSpendCardVault.setCardStatus(cardId, true|false)",
        "AgentSpendCardVault.spendCard(cardId, recipient, amountBaseUnits, memo) by the assigned agent",
      ],
      proofRequired: ["cardId", "createCard tx hash", "approve tx hash", "topUpCard tx hash", "cards(cardId) state", "spend tx hash if used"],
    }, null, 2));
  } else if (command === "policy-guide") {
    const slug = args[0] || "treasury-router";
    const dailyLimit = args[1] || "10";
    console.log(JSON.stringify({
      protocol: "arcpay-mantle-policy-plan",
      agentSlug: slug,
      agentId: id(slug),
      workspacePolicy: {
        scope: "Global workspace controls",
        enforcedAcross: ["payments", "orders", "x402", "cards", "invoices", "privacy", "RealClaw", "DeFi/RWA intents"],
        defaultChecks: ["wallet required", "treasury pause", "allowed token", "allowed network", "risk floor", "per-transaction max", "daily max"],
      },
      agentPolicy: {
        scope: "Per-agent controls",
        dailyLimitMntOrUsdy: dailyLimit,
        allowedActions: ["x402 work", "escrow order", "USDY card spend", "RealClaw handoff", "RWA intent"],
        evidenceRequired: ["tx hash", "x402 verification", "ArcPay order id", "RealClaw/venue evidence when applicable"],
      },
    }, null, 2));
  } else if (command === "evidence-template") {
    console.log([
      "ArcPay Mantle Evidence Checklist",
      "",
      "- Wallet address and chain id 5003.",
      "- Agent slug, agent id, registered endpoint, and capability metadata.",
      "- Policy snapshot: global workspace policy plus per-agent limits.",
      "- x402 quote response: HTTP status, payment requirements, request URI, amount.",
      "- Order evidence: createOrder tx hash, order id, state before/after fulfill, settle/refund tx.",
      "- Card evidence: card id, approve/top-up tx, card state, spend tx if used.",
      "- Privacy evidence: commitment, encrypted memo URI, create/release tx, nullifier.",
      "- Invoice evidence: invoice id, create/pay/cancel tx, payer and token state.",
      "- RealClaw/Byreal evidence: agent address, venue response, transaction hash, volume/ROI snapshot.",
      "- Audit page screenshot and Mantlescan links for every tx hash.",
    ].join("\n"));
  } else if (command === "realclaw-handoff") {
    const info = deployment();
    const strategyName = args[0] || "arcpay-treasury-cfo";
    const agentSlug = args[1] || "treasury-router";
    const budgetMnt = args[2] || "0.05";
    console.log(JSON.stringify({
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
        registry: info.contracts.AgentRegistry,
        orderBook: info.contracts.AgentOrderBook,
        policy: info.contracts.TreasuryPolicy,
        privacyVault: info.contracts.MantlePrivacyVault,
        reputation: info.contracts.AgentReputationBook,
      },
      setup: [
        "Create and configure the agent inside the RealClaw Telegram bot with Mantle Skills.",
        "Connect the wallet RealClaw registers as the Mantle agent address.",
        "Keep the Telegram bot token and RealClaw secrets in RealClaw, not ArcPay.",
        "Paste this payload into the RealClaw Telegram agent instructions/config.",
        "Do not mark Merchant Moe, Agni, Fluxion, Aave, USDY, or mETH as Mantle Sepolia live unless official testnet contracts are supplied.",
        "If RealClaw produces venue activity, attach tx/volume/ROI evidence back into ArcPay before claiming completion.",
      ],
    }, null, 2));
  } else if (command === "defi-status") {
    const info = deployment();
    console.log(JSON.stringify({
      chain: "mantle-testnet",
      chainId: 5003,
      boundary: "ArcPay vault swap/yield actions are wallet-signed on Mantle Testnet. Official @mantleio/mantle-core Sepolia protocol registry is empty; partner DEX/RWA venues are not testnet-live.",
      liveVault: {
        address: info.contracts.ArcPayMantleDeFiVault,
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
    }, null, 2));
  } else if (command === "zerodev-status") {
    const projectId = process.env.ZERODEV_PROJECT_ID || process.env.ZERO_DEV_PROJECT_ID || process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID || DEFAULT_ZERODEV_PROJECT_ID;
    const chainId = process.env.ZERODEV_CHAIN_ID || "5003";
    console.log(JSON.stringify({
      chain: "mantle-testnet",
      chainId: Number(chainId),
      configured: Boolean(projectId),
      bundlerRpc: process.env.ZERODEV_BUNDLER_RPC_URL || process.env.ZERODEV_RPC_URL || (projectId ? `https://rpc.zerodev.app/api/v3/${projectId}/chain/${chainId}` : null),
      policyWebhook: process.env.ZERODEV_POLICY_WEBHOOK_URL || "https://arcpay-mantle.vercel.app/api/zerodev/sponsor-policy",
      requiredEvidence: ["userOp hash", "sponsor decision JSON", "transaction hash", "ArcPay policy/audit record"],
    }, null, 2));
  } else if (command === "demo-path") {
    console.log([
      "1. Connect wallet and switch to Mantle Testnet.",
      "2. Register a provider on /agents.",
      "3. Set policy and allowlist the agent on /policies.",
      "4. Create an escrowed order on /orders.",
      "5. Move order through accept -> processing -> fulfill -> settle or fail/refund.",
      "6. Create claim codes and webhook circuit breakers on /operator.",
      "7. Request risk scoring on /oracle.",
      "8. Create and release encrypted Privacy Intents on /privacy.",
      "9. Create, pay, cancel, and sync MNT/USDY invoices on /invoices.",
      "10. Show /audit, /status, and /proofs.",
    ].join("\n"));
  } else if (command === "smoke") {
    console.log([
      "Run local + live verification:",
      "npm run build:frontend",
      "npm test",
      "npm run check:worker",
      "npm run check:x402",
      "npm run smoke:auth",
      "npm run smoke:live",
      "npm run smoke:x402",
    ].join("\n"));
  } else if (command === "mcp-config") {
    console.log(JSON.stringify({
      mcpServers: {
        "arcpay-mantle": {
          command: "arcpay-mantle-mcp",
        },
      },
    }, null, 2));
  } else {
    usage();
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
