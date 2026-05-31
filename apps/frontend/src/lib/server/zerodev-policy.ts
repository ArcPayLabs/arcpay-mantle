import { Interface, getAddress, isAddress, parseEther, parseUnits } from "ethers";
import deployment from "../../../../../deployments/mantle-testnet.json";
import { trackUsageEvent } from "./usage";

const ERC20 = new Interface([
  "function approve(address spender,uint256 amount)",
  "function transfer(address to,uint256 amount)",
]);

const ARCPAY_ABIS = new Interface([
  "function registerAgent(bytes32 agentId,string name,string endpoint,string capabilities,uint256 priceWei)",
  "function updateAgent(bytes32 agentId,string name,string endpoint,string capabilities,uint256 priceWei,bool active)",
  "function createOrder(bytes32 agentId,string requestUri)",
  "function settleOrder(bytes32 orderId)",
  "function setPolicy(bytes32 agentId,uint256 hourlyLimit,uint256 dailyLimit,uint256 perTxLimit,bool active)",
  "function approveSpend(bytes32 agentId,bool approved)",
  "function createNativeIntent(bytes32 commitment,string encryptedMemoUri)",
  "function createTokenIntent(bytes32 commitment,address token,uint256 amount,string encryptedMemoUri)",
  "function releaseIntent(bytes32 commitment,bytes32 nullifier,address recipient)",
  "function createInvoice(bytes32 invoiceId,address payer,address asset,uint256 amount,string memo)",
  "function payNativeInvoice(bytes32 invoiceId)",
  "function payTokenInvoice(bytes32 invoiceId)",
  "function createCard(bytes32 cardId,address agent,address asset,uint256 limit,string label)",
  "function fundNativeCard(bytes32 cardId)",
  "function fundTokenCard(bytes32 cardId,uint256 amount)",
  "function spendCard(bytes32 cardId,address recipient,uint256 amount,string memo)",
  "function recordAction(bytes32 agentId,bytes32 actionId,string evidenceUri,uint8 scoreDelta)",
  "function attest(bytes32 agentId,bytes32 actionId,string evidenceUri,uint8 scoreDelta)",
]);

const ALLOWED_CONTRACTS = namedContracts();
const ALLOWED_SELECTORS = new Set([
  ...functionSelectors(ARCPAY_ABIS),
  ERC20.getFunction("approve")!.selector,
  ERC20.getFunction("transfer")!.selector,
]);

export async function evaluateZeroDevPolicy(body: unknown) {
  const operation = normalizeUserOperation(body);
  const expectedChainId = Number(process.env.MANTLE_CHAIN_ID || deployment.chainId || 5003);
  const maxNativeValueWei = parseEther(process.env.ZERODEV_MAX_NATIVE_VALUE_MNT || "0.005");
  const maxTokenAmount = parseUnits(process.env.ZERODEV_MAX_TOKEN_AMOUNT || "10", Number(process.env.ZERODEV_TOKEN_DECIMALS || 18));
  const allowedWallets = csv(process.env.ZERODEV_ALLOWED_WALLETS).map(normalizeAddress).filter(Boolean);

  const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];
  const chainId = Number(operation.chainId || expectedChainId);
  checks.push({ name: "chain", ok: chainId === expectedChainId, detail: String(chainId) });

  const sender = normalizeAddress(operation.sender);
  checks.push({
    name: "wallet",
    ok: !allowedWallets.length || Boolean(sender && allowedWallets.includes(sender)),
    detail: !allowedWallets.length
      ? `${sender || "missing"}; no webhook wallet allowlist configured`
      : `${sender || "missing"}; ${sender && allowedWallets.includes(sender) ? "allowlisted" : "not allowlisted"}`,
  });

  const calls = operation.calls.length ? operation.calls : [{ to: operation.to, data: operation.data, value: operation.value }];
  if (!calls.length) checks.push({ name: "calls", ok: true, detail: "no direct calls found; ZeroDev dashboard contract limits must enforce target allowlist" });

  for (const [index, call] of calls.entries()) {
    const target = normalizeAddress(call.to);
    const valueWei = bigintFrom(call.value);
    const selector = selectorFrom(call.data);
    const contractName = target ? ALLOWED_CONTRACTS[target] : undefined;
    const packedUserOperation = !target && typeof call.data === "string" && call.data.startsWith("0x");

    checks.push({
      name: `call_${index}_target`,
      ok: Boolean(target && contractName) || packedUserOperation,
      detail: packedUserOperation ? "packed UserOperation callData" : `${contractName || "unknown"} ${target || ""}`.trim(),
    });
    checks.push({ name: `call_${index}_value`, ok: valueWei <= maxNativeValueWei, detail: valueWei.toString() });
    checks.push({
      name: `call_${index}_selector`,
      ok: packedUserOperation || Boolean(selector && ALLOWED_SELECTORS.has(selector)),
      detail: packedUserOperation ? "packed UserOperation callData" : selector || "missing",
    });

    if (target === normalizeAddress(deployment.usdyToken)) {
      const tokenCheck = checkTokenCall(call.data, maxTokenAmount);
      checks.push({ name: `call_${index}_token_limit`, ok: tokenCheck.ok, detail: tokenCheck.detail });
    }
  }

  const approved = checks.every((check) => check.ok);
  await trackUsageEvent({
    eventType: "zerodev_policy_checked",
    owner: sender,
    source: "zerodev-webhook",
    path: "/api/zerodev/sponsor-policy",
    status: approved ? "approved" : "rejected",
    metadata: {
      chainId,
      calls: calls.length,
      failedChecks: checks.filter((check) => !check.ok).map((check) => check.name),
    },
  });

  return {
    sponsor: approved,
    approved,
    reason: approved ? "ArcPay Mantle sponsorship policy approved" : "ArcPay Mantle sponsorship policy rejected",
    checks,
    chainId: expectedChainId,
    maxNativeValueWei: maxNativeValueWei.toString(),
    maxTokenAmount: maxTokenAmount.toString(),
    allowedContracts: denormalizeContracts(ALLOWED_CONTRACTS),
  };
}

function normalizeUserOperation(body: unknown) {
  const input = (body || {}) as Record<string, any>;
  const userOp = input.userOperation || input.userOp || input;
  const calls = Array.isArray(input.calls) ? input.calls : Array.isArray(userOp.calls) ? userOp.calls : [];
  return {
    chainId: input.chainId || input.chain_id || userOp.chainId || userOp.chain_id,
    sender: input.sender || input.wallet || userOp.sender,
    to: input.to || userOp.to || userOp.target,
    data: input.data || userOp.data || userOp.callData,
    value: input.value || userOp.value || 0,
    calls: calls.map((call: Record<string, unknown>) => ({
      to: call.to || call.target,
      data: call.data || call.callData,
      value: call.value || 0,
    })),
  };
}

function checkTokenCall(data: unknown, maxTokenAmount: bigint) {
  const callData = typeof data === "string" ? data : "";
  try {
    const parsed = ERC20.parseTransaction({ data: callData });
    const amount = BigInt(parsed?.args?.[1]?.toString() || "0");
    const spender = normalizeAddress(parsed?.args?.[0]?.toString());
    const spenderAllowed = Boolean(spender && ALLOWED_CONTRACTS[spender]);
    return {
      ok: amount <= maxTokenAmount && spenderAllowed,
      detail: `${parsed?.name || "unknown"} amount=${amount.toString()} spender=${spender || "missing"}`,
    };
  } catch {
    return { ok: false, detail: "could not decode token call" };
  }
}

function namedContracts() {
  const contracts = deployment.contracts;
  const entries = Object.entries({
    AgentRegistry: contracts.AgentRegistry,
    TreasuryPolicy: contracts.TreasuryPolicy,
    AgentTreasury: contracts.AgentTreasury,
    AgentOrderBook: contracts.AgentOrderBook,
    OperatorControls: contracts.OperatorControls,
    MantleAgentRiskOracle: contracts.MantleAgentRiskOracle,
    AgentSpendCardVault: contracts.AgentSpendCardVault,
    MantlePrivacyVault: contracts.MantlePrivacyVault,
    AgentInvoiceBook: contracts.AgentInvoiceBook,
    AgentReputationBook: contracts.AgentReputationBook,
    MockUSDY: deployment.usdyToken,
  });
  return entries.reduce<Record<string, string>>((acc, [name, address]) => {
    const normalized = normalizeAddress(address);
    if (normalized) acc[normalized] = name;
    return acc;
  }, {});
}

function functionSelectors(iface: Interface) {
  return iface.fragments
    .filter((fragment) => fragment.type === "function")
    .map((fragment) => iface.getFunction(fragment.format())?.selector)
    .filter(Boolean) as string[];
}

function selectorFrom(data: unknown) {
  const value = typeof data === "string" ? data : "";
  return /^0x[0-9a-fA-F]{8}/.test(value) ? value.slice(0, 10).toLowerCase() : null;
}

function normalizeAddress(address: unknown) {
  if (typeof address !== "string" || !isAddress(address)) return null;
  return getAddress(address).toLowerCase();
}

function bigintFrom(value: unknown) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.max(0, Math.trunc(value)));
  if (typeof value === "string" && value.trim()) return BigInt(value);
  return 0n;
}

function csv(value: string | undefined) {
  return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
}

function denormalizeContracts(contracts: Record<string, string>) {
  return Object.entries(contracts).reduce<Record<string, string>>((acc, [address, name]) => {
    acc[name] = getAddress(address);
    return acc;
  }, {});
}
