import fs from "node:fs";
import path from "node:path";
import {
  Contract,
  JsonRpcProvider,
  Wallet,
  formatEther,
  id,
  keccak256,
  parseEther,
  toUtf8Bytes,
} from "ethers";

loadEnv();

if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY missing. Mantle proof capture requires a funded testnet signer.");
}

const deployment = JSON.parse(fs.readFileSync("deployments/mantle-testnet.json", "utf8"));
const provider = new JsonRpcProvider(process.env.MANTLE_RPC_URL || "https://rpc.sepolia.mantle.xyz", 5003);
const deployer = new Wallet(process.env.PRIVATE_KEY, provider);
const requester = Wallet.createRandom().connect(provider);
const realclawAgentAddress = process.env.REALCLAW_AGENT_ADDRESS || "0xd953da085934f77cea8a2fb7a32fd48e4b1c1458";
const x402Base = process.env.NEXT_PUBLIC_X402_SERVER_URL || "https://mantle-x402.20.208.46.195.nip.io";
const explorer = process.env.MANTLE_EXPLORER_URL || "https://sepolia.mantlescan.xyz";
const c = deployment.contracts;

const registry = new Contract(c.AgentRegistry, [
  "function registerAgent(bytes32,string,string,string,uint256)",
  "function updateAgent(bytes32,string,string,uint256,bool)",
  "function agents(bytes32) view returns (address,string,string,string,uint256,bool,uint256,uint256)",
  "event AgentRegistered(bytes32 indexed agentId,address indexed owner,string name,uint256 priceWei)",
  "event AgentUpdated(bytes32 indexed agentId,string endpoint,string capabilities,uint256 priceWei,bool active)",
], deployer);

const policy = new Contract(c.TreasuryPolicy, [
  "function setPolicy(uint256,uint256,uint256,uint256,uint8,uint8,bool,bool)",
  "function setAgentAllowed(bytes32,bool)",
], requester);

const orderRequester = new Contract(c.AgentOrderBook, [
  "function createOrder(bytes32,string) payable returns (bytes32)",
  "function settleOrder(bytes32)",
  "function orders(bytes32) view returns (bytes32,bytes32,address,address,uint256,string,string,uint8,uint256,uint256)",
  "event OrderCreated(bytes32 indexed orderId,bytes32 indexed agentId,address indexed requester,address provider,uint256 amountWei,string requestUri)",
], requester);

const orderProvider = new Contract(c.AgentOrderBook, [
  "function acceptOrder(bytes32)",
  "function markProcessing(bytes32)",
  "function fulfillOrder(bytes32,string)",
  "function orders(bytes32) view returns (bytes32,bytes32,address,address,uint256,string,string,uint8,uint256,uint256)",
], deployer);

const privacy = new Contract(c.MantlePrivacyVault, [
  "function createNativeIntent(bytes32,string) payable",
  "function releaseIntent(bytes32,bytes32,address)",
  "function intents(bytes32) view returns (address,address,uint256,string,bool,bool,uint256)",
], deployer);

const invoiceIssuer = new Contract(c.AgentInvoiceBook, [
  "function createInvoice(bytes32,address,address,uint256,string)",
  "function invoices(bytes32) view returns (bytes32,address,address,address,uint256,string,uint8,uint256,uint256,uint256)",
], deployer);

const invoicePayer = new Contract(c.AgentInvoiceBook, [
  "function payNativeInvoice(bytes32) payable",
  "function invoices(bytes32) view returns (bytes32,address,address,address,uint256,string,uint8,uint256,uint256,uint256)",
], requester);

const proof = {
  capturedAt: new Date().toISOString(),
  chain: "mantle-testnet",
  chainId: 5003,
  explorer,
  app: "https://arcpay-mantle.vercel.app",
  x402Gateway: x402Base,
  deployer: deployer.address,
  requester: requester.address,
  realclawAgentAddress,
  budgetMnt: "0.05",
  contracts: c,
  steps: [],
};

const agentSlug = "treasury-router";
const agentId = id(agentSlug);
const protectedResource = `${x402Base}/agent/${agentSlug}/work`;

await step("network_and_funds", async () => {
  const network = await provider.getNetwork();
  const balance = await provider.getBalance(deployer.address);
  if (Number(network.chainId) !== 5003) throw new Error(`wrong chain ${network.chainId}`);
  if (balance < parseEther("0.25")) throw new Error(`low deployer balance ${formatEther(balance)} MNT`);
  return {
    deployer: deployer.address,
    balanceMnt: formatEther(balance),
  };
});

await step("register_or_update_treasury_router", async () => {
  const row = await registry.agents(agentId);
  const endpoint = protectedResource;
  const capabilities = [
    "realclaw-mantle-skills",
    "x402",
    "treasury",
    "policy",
    "privacy",
    `realclaw:${realclawAgentAddress}`,
    "venues:Fluxion,MerchantMoe,Agni",
  ].join(",");
  const price = parseEther("0.0001");

  if (row[0] === "0x0000000000000000000000000000000000000000") {
    const receipt = await wait(registry.registerAgent(agentId, "ArcPay RealClaw Treasury Router", endpoint, capabilities, price));
    return {
      action: "registered",
      agentSlug,
      agentId,
      txHash: receipt.hash,
      explorerUrl: txUrl(receipt.hash),
    };
  }

  if (row[0].toLowerCase() !== deployer.address.toLowerCase()) {
    return {
      action: "existing_external_owner",
      agentSlug,
      agentId,
      owner: row[0],
      note: "Cannot update without the registered owner signer.",
    };
  }

  const receipt = await wait(registry.updateAgent(agentId, endpoint, capabilities, price, true));
  return {
    action: "updated",
    agentSlug,
    agentId,
    txHash: receipt.hash,
    explorerUrl: txUrl(receipt.hash),
  };
});

await step("fund_requester_and_policy", async () => {
  const fundReceipt = await wait(deployer.sendTransaction({ to: requester.address, value: parseEther("0.2") }));
  const policyReceipt = await wait(policy.setPolicy(parseEther("0.01"), parseEther("0.05"), parseEther("0.1"), 0, 0, 0, false, true));
  const allowReceipt = await wait(policy.setAgentAllowed(agentId, true));
  return {
    requester: requester.address,
    fundTx: fundReceipt.hash,
    policyTx: policyReceipt.hash,
    allowlistTx: allowReceipt.hash,
    explorerUrls: [fundReceipt.hash, policyReceipt.hash, allowReceipt.hash].map(txUrl),
  };
});

await step("x402_payment_required", async () => {
  const started = Date.now();
  const response = await fetch(protectedResource);
  const body = await response.json();
  const latencyMs = Date.now() - started;
  if (response.status !== 402) throw new Error(`expected 402, got ${response.status}: ${JSON.stringify(body)}`);
  return {
    url: protectedResource,
    status: response.status,
    latencyMs,
    x402Version: response.headers.get("x402-version"),
    paymentRequiredHeader: Boolean(response.headers.get("x402-payment-required")),
    amountMnt: body.accepts?.[0]?.amountStt,
    action: body.accepts?.[0]?.action,
    orderBook: body.accepts?.[0]?.orderBook,
    agentId: body.accepts?.[0]?.agentId,
  };
});

let orderId;

await step("create_x402_order", async () => {
  const receipt = await wait(orderRequester.createOrder(agentId, protectedResource, { value: parseEther("0.0001") }));
  const event = findEvent(orderRequester, receipt, "OrderCreated");
  orderId = event?.args?.orderId;
  if (!orderId) throw new Error("missing OrderCreated event");
  return {
    orderId,
    txHash: receipt.hash,
    explorerUrl: txUrl(receipt.hash),
  };
});

await step("fulfill_and_unlock_x402_order", async () => {
  if (!orderId) throw new Error("missing order id from create_x402_order");
  const acceptReceipt = await wait(orderProvider.acceptOrder(orderId));
  const processingReceipt = await wait(orderProvider.markProcessing(orderId));
  const fulfillReceipt = await wait(orderProvider.fulfillOrder(orderId, `ipfs://arcpay-realclaw-proof/${agentSlug}`));
  const response = await fetch(`${protectedResource}?orderId=${orderId}`);
  const body = await response.json();
  if (!response.ok || !body.unlocked) throw new Error(`unlock failed: ${JSON.stringify(body)}`);
  return {
    orderId,
    acceptTx: acceptReceipt.hash,
    processingTx: processingReceipt.hash,
    fulfillTx: fulfillReceipt.hash,
    unlockStatus: response.status,
    unlocked: body.unlocked,
    evidenceUri: body.result?.evidenceUri,
    explorerUrls: [acceptReceipt.hash, processingReceipt.hash, fulfillReceipt.hash].map(txUrl),
  };
});

await step("settle_x402_order", async () => {
  if (!orderId) throw new Error("missing order id from create_x402_order");
  const receipt = await wait(orderRequester.settleOrder(orderId));
  const row = await orderRequester.orders(orderId);
  return {
    orderId,
    txHash: receipt.hash,
    explorerUrl: txUrl(receipt.hash),
    statusName: orderStatusName(Number(row[7])),
    amountMnt: formatEther(row[4]),
  };
});

await step("privacy_intent_release", async () => {
  const commitment = id(`arcpay-realclaw-privacy-${Date.now()}`);
  const nullifier = id(`arcpay-realclaw-nullifier-${Date.now()}`);
  const createReceipt = await wait(privacy.createNativeIntent(commitment, "encrypted://arcpay-realclaw-mantle-proof", { value: parseEther("0.00001") }));
  const releaseReceipt = await wait(privacy.releaseIntent(commitment, nullifier, requester.address));
  const intent = await privacy.intents(commitment);
  if (!intent[4]) throw new Error("privacy intent not released");
  return {
    commitment,
    nullifier,
    createTx: createReceipt.hash,
    releaseTx: releaseReceipt.hash,
    recipient: requester.address,
    explorerUrls: [createReceipt.hash, releaseReceipt.hash].map(txUrl),
  };
});

await step("native_invoice_paid", async () => {
  const invoiceId = id(`arcpay-realclaw-invoice-${Date.now()}`);
  const amount = parseEther("0.0001");
  const createReceipt = await wait(invoiceIssuer.createInvoice(invoiceId, requester.address, "0x0000000000000000000000000000000000000000", amount, "arcpay://invoice/realclaw-proof"));
  const payReceipt = await wait(invoicePayer.payNativeInvoice(invoiceId, { value: amount }));
  const row = await invoiceIssuer.invoices(invoiceId);
  if (Number(row[6]) !== 1) throw new Error(`invoice not paid: ${row[6]}`);
  return {
    invoiceId,
    createTx: createReceipt.hash,
    payTx: payReceipt.hash,
    amountMnt: formatEther(amount),
    statusName: "Paid",
    explorerUrls: [createReceipt.hash, payReceipt.hash].map(txUrl),
  };
});

proof.summary = {
  ok: proof.steps.every((item) => item.ok),
  txCount: proof.steps.flatMap((item) => extractTxs(item.result)).length,
  realclawAgentAddress,
  agentSlug,
  protectedResource,
};

fs.mkdirSync("proofs", { recursive: true });
fs.writeFileSync("proofs/mantle-live-proof.json", `${JSON.stringify(proof, null, 2)}\n`);
console.log(JSON.stringify(proof.summary, null, 2));
console.log("Wrote proofs/mantle-live-proof.json");

if (!proof.summary.ok) process.exit(1);

async function step(name, fn) {
  try {
    const result = await fn();
    proof.steps.push({ name, ok: true, result });
    console.log(`PASS ${name}`);
  } catch (error) {
    proof.steps.push({ name, ok: false, error: error?.shortMessage || error?.message || String(error) });
    console.log(`FAIL ${name}: ${error?.shortMessage || error?.message || String(error)}`);
  }
}

async function wait(txPromise) {
  return (await txPromise).wait();
}

function findEvent(contract, receipt, name) {
  return receipt.logs.map((log) => {
    try {
      return contract.interface.parseLog(log);
    } catch {
      return null;
    }
  }).find((event) => event?.name === name);
}

function txUrl(hash) {
  return `${explorer}/tx/${hash}`;
}

function orderStatusName(status) {
  return ["Pending", "Accepted", "Processing", "Fulfilled", "Settled", "Refunded", "Failed"][status] ?? `Unknown(${status})`;
}

function extractTxs(value) {
  if (!value || typeof value !== "object") return [];
  const txs = [];
  for (const [key, item] of Object.entries(value)) {
    if (key.toLowerCase().includes("tx") && typeof item === "string" && item.startsWith("0x")) txs.push(item);
    if (Array.isArray(item)) txs.push(...item.filter((entry) => typeof entry === "string" && entry.includes("/tx/")));
  }
  return txs;
}

function loadEnv() {
  if (!fs.existsSync(".env")) return;
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index > 0 && !process.env[trimmed.slice(0, index)]) {
      process.env[trimmed.slice(0, index)] = trimmed.slice(index + 1);
    }
  }
}
