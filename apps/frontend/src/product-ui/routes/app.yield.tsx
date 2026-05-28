"use client";

import { useState } from "react";
import { Bot, CheckCircle2, ShieldCheck, TrendingUp, WalletCards, Workflow } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/primitives/StatCard";
import { writeRecord } from "@mantle/lib/mantle";

export const Route = { options: { component: YieldRoute } };

function YieldRoute() {
  const [form, setForm] = useState({ asset: "USDY", amount: "10", target: "low-risk treasury yield", maxDrawdown: "2", agent: "yield-strategy-agent" });
  const [message, setMessage] = useState("Mantle yield is represented as governed strategy intent until a stable vault adapter is selected.");

  function saveIntent() {
    writeRecord({ id: crypto.randomUUID(), type: "audit", title: `Yield intent ${form.amount} ${form.asset}`, amount: `${form.amount} ${form.asset}`, status: "strategy_intent_saved" });
    setMessage("Yield intent saved. Convert it into an escrowed strategy order when an adapter is selected.");
  }

  const guardrails = [
    { label: "Asset", value: form.asset },
    { label: "Amount", value: form.amount },
    { label: "Risk limit", value: `${form.maxDrawdown}% max drawdown` },
    { label: "Executor", value: form.agent },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={TrendingUp} eyebrow="Yield strategy" title="Agent-managed yield intents" description="Prepare policy-approved treasury strategy requests for Mantle agents. This page records governed intent and risk boundaries until a production-grade vault adapter is selected." />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} label="Strategy" value="Intent" hint="No simulated APY" />
        <StatCard icon={ShieldCheck} label="Policy" value="Required" hint="Spend controls first" />
        <StatCard icon={WalletCards} label="Asset" value={form.asset} hint="Treasury asset" />
        <StatCard icon={Bot} label="Agent" value="Ready" hint={form.agent} emphasis />
      </div>
      <section className="grid grid-cols-1 lg:grid-cols-[0.75fr_1fr] gap-4">
        <form className="rounded-2xl border border-border bg-card p-5 space-y-4" onSubmit={(event) => { event.preventDefault(); saveIntent(); }}>
          {Object.entries(form).map(([key, value]) => (
            <label key={key} className="block">
              <span className="text-sm font-medium capitalize">{key}</span>
              <input className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3" value={value} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
            </label>
          ))}
          <button className="h-12 rounded-xl bg-primary px-4 font-semibold text-primary-foreground" type="submit">Save yield intent</button>
          <div className="rounded-xl border border-border bg-muted p-3 text-sm text-muted-foreground">{message}</div>
        </form>
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <Workflow className="h-4 w-4" /> Strategy lifecycle
            </div>
            <div className="mt-5 space-y-3">
              {[
                "Record target asset, amount, risk boundary, and executor agent.",
                "Evaluate the intent against workspace policy and emergency pause.",
                "Create an escrowed strategy order only after operator approval.",
                "Attach a Mantle vault adapter once reliable testnet liquidity is selected.",
              ].map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl bg-muted/40 p-3 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
                  <span className="text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {guardrails.map((item) => (
              <article className="rounded-2xl border border-border bg-card p-5" key={item.label}>
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <h2 className="mt-8 text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">{item.label}</h2>
                <p className="mt-2 break-all text-xl font-semibold">{item.value}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
