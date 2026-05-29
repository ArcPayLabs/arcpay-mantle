import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import type { HardhatUserConfig } from "hardhat/config";

const privateKey = normalizePrivateKey(process.env.PRIVATE_KEY);
const mantlescanApiUrl = process.env.MANTLESCAN_API_URL ?? "https://api-sepolia.mantlescan.xyz/api";
const mantlescanBrowserUrl = process.env.MANTLE_EXPLORER_URL ?? "https://sepolia.mantlescan.xyz";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    mantleTestnet: {
      url: process.env.MANTLE_RPC_URL ?? "https://rpc.sepolia.mantle.xyz",
      chainId: Number(process.env.MANTLE_CHAIN_ID ?? 5003),
      accounts: privateKey ? [privateKey] : [],
      timeout: 120000,
    },
  },
  etherscan: {
    apiKey: {
      mantleTestnet: process.env.MANTLESCAN_API_KEY ?? "",
    },
    customChains: [
      {
        network: "mantleTestnet",
        chainId: Number(process.env.MANTLE_CHAIN_ID ?? 5003),
        urls: {
          apiURL: mantlescanApiUrl,
          browserURL: mantlescanBrowserUrl,
        },
      },
    ],
  },
};

export default config;

function normalizePrivateKey(value: string | undefined): string | undefined {
  const key = value?.trim();
  if (!key || key === "0xYOUR_DEPLOYER_PRIVATE_KEY") {
    return undefined;
  }
  return /^0x[0-9a-fA-F]{64}$/.test(key) ? key : undefined;
}
