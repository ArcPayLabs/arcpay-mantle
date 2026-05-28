#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { id, keccak256, toUtf8Bytes } from "ethers";

const root = process.cwd();
const deploymentPath = path.join(root, "deployments", "mantle-testnet.json");

function deployment() {
  if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Missing ${deploymentPath}. Run npm run deploy:mantle first.`);
  }
  return JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
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
  arcpay-mantle demo-path              Print operator demo steps
  arcpay-mantle smoke                  Print smoke-test commands
  arcpay-mantle mcp-config             Print MCP host config
`);
}

const [, , command, ...args] = process.argv;

try {
  if (!command || command === "help" || command === "--help") {
    usage();
  } else if (command === "contracts") {
    const info = deployment();
    console.log(JSON.stringify(info.contracts, null, 2));
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
      "1. Run npm run x402.",
      "2. Register an agent slug in AgentRegistry.",
      "3. GET /agent/:slug/work returns HTTP 402 with exact MNT payment requirements.",
      "4. Payer calls AgentOrderBook.createOrder(agentId, requestUri) with quoted msg.value.",
      "5. Provider fulfills the order.",
      "6. GET /agent/:slug/work?orderId=... unlocks only after Fulfilled or Settled.",
      "",
      "Proof command: npm run smoke:x402",
    ].join("\n"));
  } else if (command === "demo-path") {
    console.log([
      "1. Connect wallet and switch to Mantle Testnet.",
      "2. Open /agents and register a provider.",
      "3. Open /policies, set limits, and allow the agent.",
      "4. Open /orders and create an escrowed order.",
      "5. Move order through accept -> processing -> fulfill -> settle or fail/refund.",
      "6. Open /operator for claim-code and webhook circuit-breaker proof.",
      "7. Open /oracle for Mantle agent risk callback proof.",
      "8. Open /privacy for encrypted-metadata payment intents and nullifier release.",
      "9. Open /invoices for MNT/USDY invoice creation, payment, cancellation, and sync.",
      "10. Open /proofs for deployed addresses and build commands.",
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
          command: "node",
          args: [path.join(root, "apps", "mcp", "server.mjs")],
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
