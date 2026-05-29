"use client";

import { useMemo, useState } from "react";
import { Bot, CheckCircle2, ClipboardCopy, KeyRound, RadioTower, Route as RouteIcon, ShieldCheck, WalletCards, Workflow } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/primitives/StatCard";
import { CONTRACTS, shortAddress, writeRecord } from "@mantle/lib/mantle";

export const Route = { options: { component: RealClawRoute } };

type Handoff = {
  strategyName: string;
  realclawNetwork: string;
  telegramAgent: string;
  operator: string;
  agentSlug: string;
  objective: string;
  budgetMnt: string;
  riskLimit: string;
  assets: string;
  x402Resource: string;
  webhookUrl: string;
};

const DEFAULT_FORM: Handoff = {
  strategyName: "arcpay-treasury-cfo",
  realclawNetwork: "RealClaw mainnet bot, ArcPay Mantle Testnet proof",
  telegramAgent: "ArcPay Mantle CFO",
  operator: "ArcPay operator",
  agentSlug: "treasury-router",
  objective: "Route approved Mantle treasury work across x402 payments, USDY invoices, and RWA yield intents only when policy allows it.",
  budgetMnt: "0.05",
  riskLimit: "Low risk, no leverage, operator approval above daily budget",
  assets: "MNT, USDY, mETH",
  x402Resource: "https://mantle-x402.20.208.46.195.nip.io/agent/research-agent/work",
  webhookUrl: "https://arcpay-mantle.vercel.app/api/developer/tools/realclaw_handoff",
};

function RealClawRoute() {
  const [form, setForm] = useState<Handoff>(DEFAULT_FORM);
  const [message, setMessage] = useState("Create a RealClaw-ready handoff without storing Telegram bot tokens in ArcPay.");

  const payload = useMemo(() => ({
    protocol: "arcpay-realclaw-handoff",
    chain: "mantle-testnet",
    chainId: 5003,
    realclawNetwork: form.realclawNetwork,
    telegramAgent: form.telegramAgent,
    strategyName: form.strategyName,
    operator: form.operator,
    agentSlug: form.agentSlug,
    objective: form.objective,
    constraints: {
      maxBudgetMnt: form.budgetMnt,
      riskLimit: form.riskLimit,
      allowedAssets: form.assets.split(",").map((asset) => asset.trim()).filter(Boolean),
      requireArcPayPolicy: true,
      requireOperatorOverrideForLeverage: true,
    },
    endpoints: {
      x402ProtectedResource: form.x402Resource,
      arcPayDeveloperTool: form.webhookUrl,
      x402Gateway: "https://mantle-x402.20.208.46.195.nip.io",
    },
    contracts: {
      registry: CONTRACTS.AgentRegistry,
      orderBook: CONTRACTS.AgentOrderBook,
      policy: CONTRACTS.TreasuryPolicy,
      privacyVault: CONTRACTS.MantlePrivacyVault,
      reputation: CONTRACTS.AgentReputationBook,
    },
  }), [form]);

  function saveHandoff() {
    writeRecord({
      id: crypto.randomUUID(),
      type: "audit",
      title: `RealClaw handoff ${form.strategyName}`,
      status: "realclaw_handoff_ready",
      amount: `${form.budgetMnt} MNT budget`,
    });
    setMessage("RealClaw handoff saved. Paste this payload into the Telegram agent instructions; ArcPay remains the Mantle Testnet policy/proof layer.");
  }

  async function copyPayload() {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setMessage("Copied RealClaw handoff payload.");
  }

  const setupSteps = [
    "Create and configure the agent inside the RealClaw Telegram bot.",
    "Keep the bot token and RealClaw secrets inside RealClaw. Do not paste them into ArcPay.",
    "Paste this ArcPay handoff payload into the Telegram agent instructions/config.",
    "Use RealClaw as the agent control surface while ArcPay provides Mantle Testnet policy, x402, contract, and audit proof.",
  ];

  const integrations = [
    { label: "RealClaw", value: "Telegram control", hint: "External agent UI" },
    { label: "ArcPay x402", value: "Paid work", hint: "HTTP 402 + order escrow" },
    { label: "Policy", value: "Required", hint: "Budget/risk gate" },
    { label: "Contracts", value: Object.keys(CONTRACTS).length, hint: "Mantle modules" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bot}
        eyebrow="Byreal / RealClaw"
        title="RealClaw agent handoff"
        description="Prepare a safe execution brief for a RealClaw Telegram agent: budget, policy, x402 endpoint, contract addresses, privacy boundary, and allowed assets. RealClaw can stay mainnet-side while ArcPay proves the Mantle Testnet treasury layer."
        actions={<button type="button" onClick={copyPayload} className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"><ClipboardCopy className="h-4 w-4" /> Copy payload</button>}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard icon={Bot} label="Adapter" value="RealClaw" hint="Operator handoff" emphasis />
        <StatCard icon={RadioTower} label="x402" value="Live" hint="Paid agent resource" />
        <StatCard icon={ShieldCheck} label="Policy" value="Enforced" hint="Budget first" />
        <StatCard icon={WalletCards} label="Assets" value="MNT/USDY" hint="mETH strategy-ready" />
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <form className="rounded-3xl border border-border bg-card p-5 space-y-4" onSubmit={(event) => { event.preventDefault(); saveHandoff(); }}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Handoff builder</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">RealClaw strategy envelope</h2>
            <p className="mt-1 text-sm text-muted-foreground">This creates an execution-ready payload. RealClaw keeps its Telegram bot and secrets; ArcPay keeps treasury policy and on-chain testnet records.</p>
          </div>
          {Object.entries(form).map(([key, value]) => (
            <label key={key} className="block">
              <span className="text-sm font-medium">{labelFor(key)}</span>
              {key === "objective" || key === "riskLimit" ? (
                <textarea className="mt-1.5 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm" value={value} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
              ) : (
                <input className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" value={value} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
              )}
            </label>
          ))}
          <button className="h-12 rounded-xl bg-primary px-5 font-semibold text-primary-foreground" type="submit">Save RealClaw handoff</button>
          <div className="rounded-xl border border-border bg-muted p-3 text-sm text-muted-foreground">{message}</div>
        </form>

        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <Workflow className="h-4 w-4" /> RealClaw onboarding path
            </div>
            <div className="mt-5 grid gap-3">
              {setupSteps.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl bg-muted/40 p-4 text-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
                  <span className="text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {integrations.map((item) => (
              <article className="rounded-2xl border border-border bg-card p-5" key={item.label}>
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h3 className="mt-8 text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">{item.label}</h3>
                <p className="mt-2 break-all text-xl font-semibold">{item.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
              </article>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-[#101414] p-5 text-white">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Payload preview</div>
                <h2 className="mt-1 text-xl font-semibold">Agent-readable execution context</h2>
              </div>
              <KeyRound className="h-5 w-5 text-primary" />
            </div>
            <pre className="mt-4 max-h-[420px] overflow-auto rounded-2xl bg-black/35 p-4 text-xs leading-relaxed text-white/75">{JSON.stringify(payload, null, 2)}</pre>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/50">
              <span>Registry {shortAddress(CONTRACTS.AgentRegistry)}</span>
              <span>OrderBook {shortAddress(CONTRACTS.AgentOrderBook)}</span>
              <span>Privacy {shortAddress(CONTRACTS.MantlePrivacyVault)}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function labelFor(key: string) {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
