import { ethers } from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying ArcPay Mantle contracts from ${deployer.address}`);

  let nonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
  const nextTx = () => ({ nonce: nonce++ });

  const AgentRegistry = await ethers.getContractFactory("AgentRegistry");
  const registry = await AgentRegistry.deploy(nextTx());
  await registry.waitForDeployment();

  const TreasuryPolicy = await ethers.getContractFactory("TreasuryPolicy");
  const policy = await TreasuryPolicy.deploy(nextTx());
  await policy.waitForDeployment();

  const AgentTreasury = await ethers.getContractFactory("AgentTreasury");
  const treasury = await AgentTreasury.deploy(nextTx());
  await treasury.waitForDeployment();

  const AgentOrderBook = await ethers.getContractFactory("AgentOrderBook");
  const orderBook = await AgentOrderBook.deploy(
    await registry.getAddress(),
    await policy.getAddress(),
    await treasury.getAddress(),
    nextTx(),
  );
  await orderBook.waitForDeployment();

  const OperatorControls = await ethers.getContractFactory("OperatorControls");
  const operatorControls = await OperatorControls.deploy(nextTx());
  await operatorControls.waitForDeployment();

  const AgentSpendCardVault = await ethers.getContractFactory("AgentSpendCardVault");
  const spendCardVault = await AgentSpendCardVault.deploy(nextTx());
  await spendCardVault.waitForDeployment();

  const MantlePrivacyVault = await ethers.getContractFactory("MantlePrivacyVault");
  const privacyVault = await MantlePrivacyVault.deploy(nextTx());
  await privacyVault.waitForDeployment();

  const AgentInvoiceBook = await ethers.getContractFactory("AgentInvoiceBook");
  const invoiceBook = await AgentInvoiceBook.deploy(nextTx());
  await invoiceBook.waitForDeployment();

  const AgentReputationBook = await ethers.getContractFactory("AgentReputationBook");
  const reputationBook = await AgentReputationBook.deploy(await orderBook.getAddress(), nextTx());
  await reputationBook.waitForDeployment();

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockUsdy = await MockERC20.deploy(nextTx());
  await mockUsdy.waitForDeployment();
  await (await mockUsdy.mint(deployer.address, 1_000_000_000_000n, nextTx())).wait();

  let platformAddress = process.env.MANTLE_AGENT_PLATFORM || "mock";
  let mockPlatformAddress: string | undefined;
  if (platformAddress === "mock") {
    const MockMantleAgentPlatform = await ethers.getContractFactory("MockMantleAgentPlatform");
    const mockPlatform = await MockMantleAgentPlatform.deploy(nextTx());
    await mockPlatform.waitForDeployment();
    mockPlatformAddress = await mockPlatform.getAddress();
    platformAddress = mockPlatformAddress;
  }
  const riskAgentId = BigInt(process.env.MANTLE_RISK_AGENT_ID ?? "13174292974160097713");
  const MantleAgentRiskOracle = await ethers.getContractFactory("MantleAgentRiskOracle");
  const riskOracle = await MantleAgentRiskOracle.deploy(platformAddress, riskAgentId, nextTx());
  await riskOracle.waitForDeployment();

  await (await policy.setOrderBook(await orderBook.getAddress(), nextTx())).wait();
  await (await treasury.setOrderBook(await orderBook.getAddress(), nextTx())).wait();

  const deployment = {
    network: "mantle-testnet",
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      AgentRegistry: await registry.getAddress(),
      TreasuryPolicy: await policy.getAddress(),
      AgentTreasury: await treasury.getAddress(),
      AgentOrderBook: await orderBook.getAddress(),
      OperatorControls: await operatorControls.getAddress(),
      MantleAgentRiskOracle: await riskOracle.getAddress(),
      AgentSpendCardVault: await spendCardVault.getAddress(),
      MantlePrivacyVault: await privacyVault.getAddress(),
      AgentInvoiceBook: await invoiceBook.getAddress(),
      AgentReputationBook: await reputationBook.getAddress(),
      MockUSDY: await mockUsdy.getAddress(),
      ...(mockPlatformAddress ? { MockMantleAgentPlatform: mockPlatformAddress } : {}),
    },
    mantleAgentPlatform: platformAddress,
    mantleRiskAgentId: riskAgentId.toString(),
    usdyToken: process.env.USDY_TOKEN_ADDRESS || await mockUsdy.getAddress(),
  };

  fs.mkdirSync("deployments", { recursive: true });
  fs.writeFileSync(path.join("deployments", "mantle-testnet.json"), `${JSON.stringify(deployment, null, 2)}\n`);

  for (const [name, address] of Object.entries(deployment.contracts)) {
    console.log(`${name}: ${address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
