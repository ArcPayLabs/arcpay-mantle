import { NextResponse } from "next/server";

function mask(value: string | undefined) {
  if (!value) return null;
  if (value.length <= 10) return "set";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

const DEFAULT_ZERODEV_PROJECT_ID = "264dd246-2927-4d4e-bcdc-9adbab13d7fd";

export async function GET() {
  const projectId = process.env.ZERODEV_PROJECT_ID ?? process.env.ZERO_DEV_PROJECT_ID ?? process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID ?? DEFAULT_ZERODEV_PROJECT_ID;
  const apiKey = process.env.ZERODEV_API_KEY;
  const chainId = Number(process.env.ZERODEV_CHAIN_ID ?? 5003);
  const bundlerRpc = process.env.ZERODEV_BUNDLER_RPC_URL ?? process.env.ZERODEV_RPC_URL ?? (projectId ? `https://rpc.zerodev.app/api/v3/${projectId}/chain/${chainId}` : null);
  const paymasterRpc = process.env.ZERODEV_PAYMASTER_RPC_URL ?? process.env.ZERODEV_RPC_URL ?? bundlerRpc;
  const webhookUrl = process.env.ZERODEV_POLICY_WEBHOOK_URL ?? "https://arcpay-mantle.vercel.app/api/zerodev/sponsor-policy";

  return NextResponse.json({
    ok: Boolean(projectId && bundlerRpc),
    chain: "mantle-testnet",
    chainId,
    projectId: mask(projectId),
    apiKey: apiKey ? "configured" : "not-configured",
    bundlerRpc,
    paymasterRpc,
    policyWebhook: webhookUrl,
    sponsorshipMode: "ArcPay policy webhook plus contract/wallet/chain limits in ZeroDev dashboard",
    requiredEvidence: ["userOp hash", "sponsor decision JSON", "transaction hash", "ArcPay policy/audit record"],
    productionBoundary: "This endpoint reports ZeroDev configuration only. A completed sponsored action still requires a userOp hash and on-chain receipt.",
  });
}
