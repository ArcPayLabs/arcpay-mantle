import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

const skills = [
  {
    name: "ArcPay Mantle x402 agent payments",
    type: "mcp-tool",
    description: "Plan and verify x402 paid Mantle agent work with escrow evidence.",
    url: "https://arcpay-mantle.vercel.app/api/mcp",
  },
  {
    name: "ArcPay Mantle RealClaw handoff",
    type: "mcp-tool",
    description: "Prepare RealClaw-safe handoff payloads, budgets, constraints, and proof requirements.",
    url: "https://arcpay-mantle.vercel.app/api/mcp",
  },
  {
    name: "ArcPay Mantle starter kit",
    type: "npm-package",
    description: "Plug-and-play client for builders selling or consuming paid agent work through ArcPay x402.",
    url: "https://www.npmjs.com/package/@arcpaylabs/mantle-x402-agent-starter",
  },
].map((skill) => ({
  ...skill,
  sha256: createHash("sha256").update(`${skill.name}:${skill.url}`).digest("hex"),
}));

export function GET() {
  return NextResponse.json({
    $schema: "https://agentskills.io/schemas/agent-skills-index-v0.2.json",
    name: "ArcPay Mantle agent skills",
    description: "Discovery index for ArcPay Mantle agent treasury, x402, privacy, RealClaw, ZeroDev, and evidence tools.",
    skills,
  });
}
