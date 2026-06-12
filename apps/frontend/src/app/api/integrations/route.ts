import { NextResponse } from "next/server";
import deployment from "../../../../../../deployments/mantle-testnet.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const venues = [
  {
    name: "ArcPay Mantle DeFi Vault",
    category: "native-testnet-execution",
    configured: true,
    state: "live-wallet-signed",
    execution: "Wallet-signed MNT vault swap-credit plus MNT yield deposit/withdraw on Mantle Testnet.",
    proofUrl: "/proofs/mantle-defi-vault-live-proof.json",
    evidence: ["swap transaction hash", "yield deposit transaction hash", "vault position", "before/after token balance"],
  },
  {
    name: "RealClaw / Byreal",
    category: "agent-executor",
    configured: true,
    state: "handoff-evidence-only",
    execution: "Operator-configured RealClaw agent receives ArcPay policy payload; completion requires returned tx/venue evidence.",
    url: "https://www.byreal.io/en/realclaw",
    evidence: ["registered agent address", "venue response", "transaction hash", "volume/ROI snapshot"],
  },
  {
    name: "Merchant Moe",
    category: "mainnet-reference",
    configured: true,
    state: "not-testnet-live",
    execution: "Official Mantle package registry has mainnet contracts but no Sepolia protocol contracts.",
    docs: "https://docs.merchantmoe.com/",
    evidence: ["route quote", "router address", "swap transaction hash", "before/after balance"],
  },
  {
    name: "Agni Finance",
    category: "dex-testnet-contracts",
    configured: true,
    state: "testnet-contracts-discovered",
    execution: "Mantle Sepolia contracts have bytecode; ArcPay requires a real quote/signed swap tx before marking an Agni action complete.",
    url: "https://agni.finance/",
    contracts: {
      factory: "0xA9AcD50B042A72c33d05fDcC8ad209d3aD361762",
      swapRouter: "0xe38cfa32cCd918d94E2e20230dFaD1A4Fd8aEF16",
      quoter: "0xA82F8dC4704d3512b120de70480219761F24B6Eb",
      quoterV2: "0x9Da17239a4170f50A5A2c11813BD0C601b5c9693",
      wmnt: "0x67A1f4A939b477A6b7c5BF94D97E45dE87E608eF",
    },
    evidence: ["route quote", "signed Agni tx", "before/after balances", "ArcPay audit record"],
  },
  {
    name: "Fluxion",
    category: "mainnet-reference",
    configured: true,
    state: "not-testnet-live",
    execution: "Official Mantle package registry has mainnet contracts but no Sepolia protocol contracts.",
    evidence: ["agent address", "venue result", "transaction hash", "risk snapshot"],
  },
  {
    name: "USDY / mETH",
    category: "mainnet-reference",
    configured: true,
    state: "not-testnet-live",
    execution: "Not exposed as Mantle Sepolia execution because the official Sepolia token registry only includes MNT and WMNT.",
    evidence: ["operator approval", "allocation tx", "final balance", "risk memo"],
  },
];

export async function GET() {
  const projectId =
    process.env.ZERODEV_PROJECT_ID ??
    process.env.ZERO_DEV_PROJECT_ID ??
    process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID ??
    "264dd246-2927-4d4e-bcdc-9adbab13d7fd";

  const chainId = Number(process.env.ZERODEV_CHAIN_ID ?? deployment.chainId ?? 5003);
  const zerodevRpc =
    process.env.ZERODEV_BUNDLER_RPC_URL ??
    process.env.ZERODEV_RPC_URL ??
    `https://rpc.zerodev.app/api/v3/${projectId}/chain/${chainId}`;

  return NextResponse.json({
    ok: true,
    network: {
      name: deployment.network,
      chainId: deployment.chainId,
    },
    integrations: {
      zerodev: {
        configured: Boolean(projectId && zerodevRpc),
        apiKeyConfigured: Boolean(process.env.ZERODEV_API_KEY),
        projectId: mask(projectId),
        rpcUrl: maskUrl(zerodevRpc),
        sponsorPolicy: "/api/zerodev/sponsor-policy",
        maxNativeValueEth: process.env.ZERODEV_MAX_NATIVE_VALUE_ETH || "0.005",
        maxTokenAmount: process.env.ZERODEV_MAX_TOKEN_AMOUNT || "10",
        walletAllowlistEnabled: Boolean(process.env.ZERODEV_ALLOWED_WALLETS),
        purpose: "Policy-gated smart-account sponsorship for approved ArcPay Mantle actions.",
      },
      realclaw: {
        configured: true,
        mode: "handoff-live",
        handoff: "/realclaw",
        status: "/api/mantle/defi/status",
        purpose: "Telegram-controlled Mantle agent handoff with ArcPay policy, x402, escrow, card, privacy, and audit requirements.",
      },
      byreal: {
        configured: true,
        mode: "skills-handoff",
        status: "/api/mantle/defi/status",
        purpose: "Byreal/RealClaw-style agent workflow evidence; SDK package remains reference-only for Mantle because the public SDK is Solana-focused.",
      },
      mantleDefi: {
        configured: true,
        mode: "live-testnet-vault-plus-agni-contracts-plus-mainnet-references",
        venues,
        status: "/api/mantle/defi/status",
        liveProof: "/proofs/mantle-defi-vault-live-proof.json",
        packageAudit: {
          package: "@mantleio/mantle-core@0.1.19",
          sepoliaProtocols: "official Mantle core package empty; Agni publishes separate Mantle Sepolia contracts verified by RPC bytecode",
          sepoliaTokens: ["MNT", "WMNT"],
          testnetContractReferences: ["Agni Finance"],
          mainnetOnlyReferences: ["Merchant Moe", "Fluxion", "Aave V3", "USDY", "mETH"],
        },
        purpose: "ArcPay vault handles live Mantle testnet swap/yield execution. Agni Sepolia contracts are configured, but partner DEX/RWA actions are only marked complete after real quote/tx/balance evidence.",
      },
    },
    contracts: {
      policy: deployment.contracts.TreasuryPolicy,
      orderBook: deployment.contracts.AgentOrderBook,
      privacyVault: deployment.contracts.MantlePrivacyVault,
      spendCardVault: deployment.contracts.AgentSpendCardVault,
      invoiceBook: deployment.contracts.AgentInvoiceBook,
      reputation: deployment.contracts.AgentReputationBook,
      defiVault: deployment.contracts.ArcPayMantleDeFiVault,
      testCredit: deployment.usdyToken,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}

function mask(value?: string) {
  if (!value) return null;
  return value.length <= 10 ? "***" : `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function maskUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname.split("/").slice(0, 5).join("/")}/...`;
  } catch {
    return mask(value);
  }
}
