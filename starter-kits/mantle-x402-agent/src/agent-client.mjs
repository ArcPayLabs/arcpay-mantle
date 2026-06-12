#!/usr/bin/env node
import "dotenv/config";
import { id, keccak256, toUtf8Bytes } from "ethers";

const serverUrl = (process.env.ARCPAY_X402_SERVER_URL || "https://mantle-x402.20.208.46.195.nip.io").replace(/\/+$/, "");
const appUrl = "https://arcpay-mantle.vercel.app";
const chainId = 5003;
const contracts = {
  registry: "0xE2E4377A1739cEeC00F30D64271D2229cD7BAFe1",
  orderBook: "0x458D69ada1661640ff7E6C77E42bF891D065bBbf",
  policy: "0xa782eC1B6e748e8101869842767f475c8CD35d69",
  operatorControls: "0x5D57f3c20A64342e251D14b7A72cD06D4950934b",
  spendCardVault: "0x0fB5C031E6Ff2887f9402c0c39378eF1f6707F90",
  privacyVault: "0x717CB18B08bE0c2ce1c897d879025c4a90861c20",
  reputation: "0xADA1E468a640A4ff4171c53523095Af58e30aC51",
  usdy: "0xda41b9EB708d32b29F4d90468298c69824A15E5C",
};
const [, , command = "help", arg1 = "research-agent", arg2 = "research-agent"] = process.argv;

async function main() {
  if (command === "quote") {
    const body = await getJson(`/x402/payment-requirements/${encodeURIComponent(arg1)}`);
    print(body);
  } else if (command === "locked") {
    const response = await fetch(`${serverUrl}/agent/${encodeURIComponent(arg1)}/work`);
    const body = await response.json();
    print({ status: response.status, body });
  } else if (command === "verify") {
    const body = await postJson("/x402/verify", { orderId: arg1, agentSlug: arg2 });
    print(body);
  } else if (command === "unlock") {
    const body = await getJson(`/agent/${encodeURIComponent(arg1)}/work?orderId=${encodeURIComponent(arg2)}`);
    print(body);
  } else if (command === "agent-id") {
    console.log(id(arg1));
  } else if (command === "onboard") {
    print(onboardPayload(arg1, arg2));
  } else if (command === "card") {
    print(cardPlan(arg1, arg2));
  } else if (command === "policy") {
    print(policyPlan(arg1, arg2));
  } else if (command === "evidence") {
    print(evidenceTemplate(arg1));
  } else {
    console.log([
      "ArcPay Mantle x402 Agent Starter",
      "",
      "Commands:",
      "  node src/agent-client.mjs quote <agentSlug>",
      "  node src/agent-client.mjs locked <agentSlug>",
      "  node src/agent-client.mjs verify <orderId> <agentSlug>",
      "  node src/agent-client.mjs unlock <agentSlug> <orderId>",
      "  node src/agent-client.mjs agent-id <agentSlug>",
      "  node src/agent-client.mjs onboard <agentSlug> <endpoint>",
      "  node src/agent-client.mjs card <agentSlug> <agentWallet>",
      "  node src/agent-client.mjs policy <agentSlug> <dailyLimit>",
      "  node src/agent-client.mjs evidence <agentSlug>",
    ].join("\n"));
  }
}

async function getJson(path) {
  const response = await fetch(`${serverUrl}${path}`);
  const body = await response.json();
  if (!response.ok && response.status !== 402) throw new Error(body.error || `HTTP ${response.status}`);
  return body;
}

async function postJson(path, payload) {
  const response = await fetch(`${serverUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
  return body;
}

function print(value) {
  console.log(JSON.stringify(value, null, 2));
}

function onboardPayload(agentSlug, endpoint = `${serverUrl}/agent/${agentSlug}/work`) {
  return {
    protocol: "arcpay-mantle-agent-onboarding",
    chain: "mantle-testnet",
    chainId,
    app: appUrl,
    x402Server: serverUrl,
    agentSlug,
    agentId: id(agentSlug),
    endpoint,
    contracts,
    nextSteps: [
      "Register the agent slug/capabilities in ArcPay or AgentRegistry.",
      "If external, create/redeem an OperatorControls claim code.",
      "Attach workspace policy and optional per-agent limits.",
      "Use quote -> create order -> verify -> fulfill -> unlock for x402 paid work.",
    ],
  };
}

function cardPlan(agentSlug, agentWallet = "<agent-wallet-address>") {
  const cardSlug = `${agentSlug}-usdy-card`;
  return {
    protocol: "arcpay-mantle-usdy-card",
    chainId,
    agentSlug,
    agentWallet,
    cardSlug,
    cardId: keccak256(toUtf8Bytes(cardSlug)),
    contracts: {
      spendCardVault: contracts.spendCardVault,
      usdy: contracts.usdy,
    },
    calls: [
      "approve USDY to AgentSpendCardVault",
      "createCard(cardId, agentWallet, USDY, limitBaseUnits, label)",
      "topUpCard(cardId, amountBaseUnits)",
      "setCardStatus(cardId, true) before spend",
      "agent calls spendCard(cardId, recipient, amountBaseUnits, memo)",
    ],
  };
}

function policyPlan(agentSlug, dailyLimit = "10") {
  return {
    protocol: "arcpay-mantle-policy-plan",
    agentSlug,
    agentId: id(agentSlug),
    workspacePolicy: ["treasury pause", "allowed token", "allowed network", "risk floor", "per-tx max", "daily max"],
    agentPolicy: {
      dailyLimit,
      allowedActions: ["x402", "order", "card-spend", "RealClaw handoff", "RWA intent"],
      evidenceRequired: ["tx hash", "x402 verification", "order state", "RealClaw/venue evidence where applicable"],
    },
  };
}

function evidenceTemplate(agentSlug) {
  return {
    agentSlug,
    required: [
      "agent id and registration tx or claim-code redemption",
      "policy snapshot before action",
      "x402 quote response or order request",
      "Mantle tx hash for every signed operation",
      "order/card/invoice/privacy state after execution",
      "RealClaw/Byreal venue evidence when used",
      "audit page record and Mantlescan URL",
    ],
  };
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
