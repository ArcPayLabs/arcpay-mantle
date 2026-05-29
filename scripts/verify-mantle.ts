import { run } from "hardhat";
import fs from "node:fs";
import path from "node:path";

type Deployment = {
  contracts: Record<string, string>;
  mantleAgentPlatform?: string;
  mantleRiskAgentId?: string;
};

const deploymentPath = path.join(process.cwd(), "deployments", "mantle-testnet.json");
const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8")) as Deployment;
const contracts = deployment.contracts;

const verifications: Array<{ name: string; args: unknown[] }> = [
  { name: "AgentRegistry", args: [] },
  { name: "TreasuryPolicy", args: [] },
  { name: "AgentTreasury", args: [] },
  {
    name: "AgentOrderBook",
    args: [contracts.AgentRegistry, contracts.TreasuryPolicy, contracts.AgentTreasury],
  },
  { name: "OperatorControls", args: [] },
  {
    name: "MantleAgentRiskOracle",
    args: [
      deployment.mantleAgentPlatform ?? contracts.MockMantleAgentPlatform,
      deployment.mantleRiskAgentId ?? "13174292974160097713",
    ],
  },
  { name: "AgentSpendCardVault", args: [] },
  { name: "MantlePrivacyVault", args: [] },
  { name: "AgentInvoiceBook", args: [] },
  { name: "AgentReputationBook", args: [contracts.AgentOrderBook] },
  { name: "MockUSDY", args: [] },
  { name: "MockMantleAgentPlatform", args: [] },
];

async function main() {
  if (!process.env.MANTLESCAN_API_KEY) {
    throw new Error("Set MANTLESCAN_API_KEY before running contract verification.");
  }

  for (const item of verifications) {
    const address = contracts[item.name];
    if (!address) {
      console.warn(`Skipping ${item.name}: no address in ${deploymentPath}`);
      continue;
    }

    try {
      console.log(`Verifying ${item.name} at ${address}`);
      await run("verify:verify", {
        address,
        constructorArguments: item.args,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("already verified")) {
        console.log(`${item.name} already verified`);
        continue;
      }
      throw error;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
