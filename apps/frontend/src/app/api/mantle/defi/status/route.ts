import { NextResponse } from "next/server";

const venues = [
  {
    name: "ArcPay Mantle DeFi Vault",
    category: "native-testnet-execution",
    state: "live-wallet-signed",
    execution: "wallet-signed MNT vault swap-credit and MNT yield deposit/withdraw on Mantle Testnet",
    proofUrl: "/proofs/mantle-defi-vault-live-proof.json",
    evidence: ["swap transaction hash", "yield deposit transaction hash", "vault position", "before/after token balance"],
  },
  {
    name: "RealClaw / Byreal",
    category: "agent-executor",
    state: "handoff-evidence-only",
    execution: "operator-configured Telegram agent receives ArcPay policy payload; completion requires returned tx/venue evidence",
    url: "https://www.byreal.io/en/realclaw",
    evidence: ["registered agent address", "venue response", "transaction hash", "volume/ROI snapshot"],
  },
  {
    name: "Merchant Moe",
    category: "mainnet-reference",
    state: "not-testnet-live",
    execution: "official Mantle package registry has mainnet contracts but no Sepolia protocol contracts",
    docs: "https://docs.merchantmoe.com/",
    evidence: ["route quote", "router address", "swap transaction hash", "before/after balance"],
  },
  {
    name: "Agni Finance",
    category: "dex-testnet-contracts",
    state: "testnet-contracts-discovered",
    execution: "Mantle Sepolia contracts have bytecode; ArcPay requires a real quote/signed swap tx before marking an Agni action complete",
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
    state: "not-testnet-live",
    execution: "official Mantle package registry has mainnet contracts but no Sepolia protocol contracts",
    evidence: ["agent address", "venue result", "transaction hash", "risk snapshot"],
  },
  {
    name: "USDY / mETH",
    category: "mainnet-reference",
    state: "not-testnet-live",
    execution: "not exposed as Mantle Sepolia execution because the official Sepolia token registry only includes MNT and WMNT",
    evidence: ["operator approval", "allocation tx", "final balance", "risk memo"],
  },
];

export async function GET() {
  return NextResponse.json({
    ok: true,
    chain: "mantle-testnet",
    chainId: 5003,
    mode: "live-testnet-vault-plus-mainnet-references",
    boundary: "ArcPay native swap/yield vault actions are wallet-signed on Mantle Testnet. Agni Sepolia contracts are configured but not marked complete without a real quote/signed swap tx. Merchant Moe, Fluxion, Aave, USDY, and mETH remain reference/evidence-only until official testnet execution exists.",
    venues,
    developerTools: {
      http: "/api/developer/tools/realclaw_handoff",
      mcp: "realclaw_handoff",
      cli: "arcpay-mantle realclaw-handoff",
    },
    liveProof: "/proofs/mantle-defi-vault-live-proof.json",
    packageAudit: {
      package: "@mantleio/mantle-core@0.1.19",
      sepoliaProtocols: "official Mantle core package empty; Agni publishes separate Mantle Sepolia contracts verified by RPC bytecode",
      sepoliaTokens: ["MNT", "WMNT"],
      testnetContractReferences: ["Agni Finance"],
      mainnetOnlyReferences: ["Merchant Moe", "Fluxion", "Aave V3", "USDY", "mETH"],
    },
    nextProofTarget: "If a partner exposes Mantle Sepolia contracts later, attach router address, tx hash, before/after balances, and ArcPay audit record before enabling it as live.",
  });
}
