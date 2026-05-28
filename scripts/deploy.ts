import { ethers } from "hardhat";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying ArcPay Mantle contracts from ${deployer.address}`);

  const registry = await ethers.deployContract("AgentRegistry");
  await registry.waitForDeployment();

  const policy = await ethers.deployContract("TreasuryPolicy");
  await policy.waitForDeployment();

  const treasury = await ethers.deployContract("AgentTreasury");
  await treasury.waitForDeployment();

  const orderBook = await ethers.deployContract("AgentOrderBook", [
    await registry.getAddress(),
    await policy.getAddress(),
    await treasury.getAddress(),
  ]);
  await orderBook.waitForDeployment();

  const operatorControls = await ethers.deployContract("OperatorControls");
  await operatorControls.waitForDeployment();

  const spendCardVault = await ethers.deployContract("AgentSpendCardVault");
  await spendCardVault.waitForDeployment();

  const privacyVault = await ethers.deployContract("MantlePrivacyVault");
  await privacyVault.waitForDeployment();

  const invoiceBook = await ethers.deployContract("AgentInvoiceBook");
  await invoiceBook.waitForDeployment();

  const reputationBook = await ethers.deployContract("AgentReputationBook", [await orderBook.getAddress()]);
  await reputationBook.waitForDeployment();

  const mockUsdy = await ethers.deployContract("MockERC20");
  await mockUsdy.waitForDeployment();
  await (await mockUsdy.mint(deployer.address, 1_000_000_000_000n)).wait();

  let platformAddress = process.env.MANTLE_AGENT_PLATFORM || "mock";
  let mockPlatformAddress: string | undefined;
  if (platformAddress === "mock") {
    const mockPlatform = await ethers.deployContract("MockMantleAgentPlatform");
    await mockPlatform.waitForDeployment();
    mockPlatformAddress = await mockPlatform.getAddress();
    platformAddress = mockPlatformAddress;
  }
  const riskAgentId = BigInt(process.env.MANTLE_RISK_AGENT_ID ?? "13174292974160097713");
  const riskOracle = await ethers.deployContract("MantleAgentRiskOracle", [platformAddress, riskAgentId]);
  await riskOracle.waitForDeployment();

  await (await policy.setOrderBook(await orderBook.getAddress())).wait();
  await (await treasury.setOrderBook(await orderBook.getAddress())).wait();

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
