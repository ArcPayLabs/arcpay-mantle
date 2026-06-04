import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    x402Version: "1",
    protocol: "x402",
    network: "mantle-testnet",
    chainId: 5003,
    resources: [
      {
        name: "ArcPay Mantle treasury-router work",
        description: "Paid Mantle agent work protected by ArcPay x402, MNT escrow, policy, and audit evidence.",
        resourceUrl: "https://mantle-x402.20.208.46.195.nip.io/agent/treasury-router/work",
        paymentRequirementsUrl: "https://mantle-x402.20.208.46.195.nip.io/x402/payment-requirements/treasury-router",
        verificationUrl: "https://mantle-x402.20.208.46.195.nip.io/x402/verify",
        method: "GET",
        asset: "MNT",
        amount: "0.01",
        payTo: "0x458D69ada1661640ff7E6C77E42bF891D065bBbf",
        settlement: "AgentOrderBook.createOrder(agentId, requestUri)",
        evidence: ["HTTP 402 response", "AgentOrderBook order id", "Mantle tx hash", "x402 verification response"],
      },
    ],
  });
}
