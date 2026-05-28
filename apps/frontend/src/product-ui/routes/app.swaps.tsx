"use client";

import { useState } from "react";
import { ArrowLeftRight, Bot, CheckCircle2, Route as RouteIcon, ShieldCheck, Workflow } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/primitives/StatCard";
import { writeRecord } from "@mantle/lib/mantle";

export const Route = { options: { component: SwapsRoute } };

function SwapsRoute() {
  const [form, setForm] = useState({ from: "MNT", to: "USDY", amount: "1", maxSlippage: "0.5", agent: "treasury-router" });
  const [message, setMessage] = useState("Mantle swap routing is modeled as policy-ready intents until a stable router adapter is selected.");

  function saveIntent() {
    writeRecord({ id: crypto.randomUUID(), type: "audit", title: `Swap intent ${form.amount} ${form.from} to ${form.to}`, amount: `${form.amount} ${form.from}`, status: "intent_saved" });
    setMessage("Swap intent saved. Convert this into an escrowed agent order for execution.");
  }

  const reviewItems = [
    { label: "Source asset", value: form.from },
    { label: "Target asset", value: form.to },
    { label: "Max slippage", value: `${form.maxSlippage}%` },
    { label: "Executor", value: form.agent },
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={ArrowLeftRight} eyebrow="Treasury routing" title="Swap intents" description="Prepare policy-checked Mantle route intents that can be handed to an agent executor or future Mantle router adapter without pretending a fill already happened." />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StatCard icon={RouteIcon} label="Route type" value="Intent" hint="No simulated fills" />
        <StatCard icon={ShieldCheck} label="Policy" value="Required" hint="Before execution" />
        <StatCard icon={Bot} label="Executor" value={form.agent} hint="Agent order ready" emphasis />
      </div>
      <section className="grid grid-cols-1 lg:grid-cols-[0.75fr_1fr] gap-4">
        <form className="rounded-2xl border border-border bg-card p-5 space-y-4" onSubmit={(event) => { event.preventDefault(); saveIntent(); }}>
          {Object.entries(form).map(([key, value]) => (
            <label key={key} className="block">
              <span className="text-sm font-medium capitalize">{key}</span>
              <input className="mt-1.5 h-11 w-full rounded-xl border border-border bg-background px-3" value={value} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
            </label>
          ))}
          <button className="h-12 rounded-xl bg-primary px-4 font-semibold text-primary-foreground" type="submit">Save swap intent</button>
          <div className="rounded-xl border border-border bg-muted p-3 text-sm text-muted-foreground">{message}</div>
        </form>
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              <Workflow className="h-4 w-4" /> Execution path
            </div>
            <div className="mt-5 space-y-3">
              {[
                "Create route intent with amount, assets, slippage, and executor.",
                "Run policy checks before any wallet signature or agent handoff.",
                "Convert approved intent into an escrowed agent order.",
                "Attach a Mantle router adapter when a production-grade route source is selected.",
              ].map((step, index) => (
                <div key={step} className="flex gap-3 rounded-2xl bg-muted/40 p-3 text-sm">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
                  <span className="text-muted-foreground">{step}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {reviewItems.map((item) => (
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
