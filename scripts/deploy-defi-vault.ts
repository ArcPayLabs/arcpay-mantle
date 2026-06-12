import fs from "node:fs";
import path from "node:path";
import { ethers } from "hardhat";

const deploymentPath = path.join(process.cwd(), "deployments", "mantle-testnet.json");

async function main() {
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const [deployer] = await ethers.getSigners();
  const usdy = deployment.usdyToken ?? deployment.contracts.MockUSDY;
  if (!usdy) throw new Error("USDY token missing from deployment");

  const rate = 1_000_000n; // 1 MNT -> 1 USDY, USDY has 6 decimals.
  const yieldBps = 520n;
  const vault = await ethers.deployContract("ArcPayMantleDeFiVault", [usdy, rate, yieldBps]);
  await vault.waitForDeployment();
  const address = await vault.getAddress();

  deployment.contracts.ArcPayMantleDeFiVault = address;
  deployment.defiVault = address;
  deployment.defiVaultUpdatedAt = new Date().toISOString();
  fs.writeFileSync(deploymentPath, `${JSON.stringify(deployment, null, 2)}\n`);

  console.log(`ArcPayMantleDeFiVault deployed by ${deployer.address}: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
