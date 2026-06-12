"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ArrowLeftRight, Bot, CheckCircle2, ClipboardCopy, Route as RouteIcon, ShieldCheck, Workflow } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/primitives/StatCard";
import { AGNI_TESTNET_CONTRACTS, connectedAddress, CONTRACTS, defiVaultContract, shortAddress, toWei, txUrl, writeRecord } from "@mantle/lib/mantle";

export const Route = { options: { component: SwapsRoute } };

const ADAPTERS = [
  { name: "ArcPay Testnet Vault", status: "Live on Sepolia", description: "Wallet-signed Mantle Testnet swap proof through the deployed ArcPay vault." },
  { name: "Mantle MCP / CLI", status: "Sepolia reads", description: "Official Mantle chain, account, token, and registry tooling for Sepolia. DEX protocols are mainnet-only in the current package registry." },
  { name: "Agni Sepolia Router", status: "Contracts verified", description: "Agni factory/router/quoter/WMNT contracts have Mantle Sepolia bytecode. Completion still requires a quote, signed swap tx, and balance evidence." },
  { name: "RealClaw / Byreal", status: "Evidence handoff", description: "Agent handoff is supported, but completion requires a RealClaw/venue tx hash or response attached to ArcPay." },
  { name: "Mainnet DEX venues", status: "Reference only", description: "Merchant Moe, Fluxion, Aave, USDY, and mETH are not exposed as Mantle Sepolia executors until official testnet contract support exists." },
  { name: "Manual signer", status: "Available now", description: "Export a policy-approved payload for a human or agent signer to execute and attach proof." },
] as const;

function SwapsRoute() {
  const [form, setForm] = useState({
    from: "MNT",
    to: "Vault credit",
    amount: "1",
    maxSlippage: "0.5",
    expiryMinutes: "20",
    adapter: "ArcPay Testnet Vault",
    agent: "treasury-router",
    objective: "Acquire ArcPay test credit for invoices and agent spend cards without exceeding policy.",
  });
  const [message, setMessage] = useState("Create a policy-ready Mantle route intent, then execute a live ArcPay testnet swap when the operator signs.");
  const [pending, setPending] = useState(false);

  const payload = useMemo(() => ({
    kind: "arcpay-mantle-swap-intent",
    chain: "mantle-testnet",
    from: form.from,
    to: form.to,
    amount: form.amount,
    maxSlippagePercent: form.maxSlippage,
    expiryMinutes: form.expiryMinutes,
    adapter: form.adapter,
    agent: form.agent,
    objective: form.objective,
    controls: {
      requirePolicyCheck: true,
      requireOperatorApproval: true,
      emergencyPauseAware: true,
      noFillClaimWithoutTxHash: true,
      requireRealClawAgentAddressForRealClaw: form.adapter.includes("RealClaw"),
      testnetLiveVenues: ["ArcPay Testnet Vault"],
      testnetContractVenues: ["Agni Sepolia Router"],
      mainnetReferenceOnlyVenues: ["Merchant Moe", "Fluxion", "Aave V3", "USDY", "mETH"],
      noAgniCompletionWithoutQuoteAndTx: true,
    },
    agni: form.adapter.includes("Agni") ? AGNI_TESTNET_CONTRACTS : undefined,
    contracts: {
      registry: CONTRACTS.AgentRegistry,
      orderBook: CONTRACTS.AgentOrderBook,
      policy: CONTRACTS.TreasuryPolicy,
      reputation: CONTRACTS.AgentReputationBook,
    },
  }), [form]);

  function saveIntent(status = form.adapter.includes("RealClaw") ? "realclaw_route_intent_ready" : "mantle_route_intent_ready", txHash?: string) {
    writeRecord({
      id: crypto.randomUUID(),
      type: "audit",
      title: `Swap intent ${form.amount} ${form.from} to ${form.to}`,
      amount: `${form.amount} ${form.from}`,
      status,
      txHash,
    });
    setMessage("Swap intent saved. Mantle Testnet execution is live only through the ArcPay vault unless external venue evidence is attached.");
  }

  async function executeArcPaySwap() {
    setPending(true);
    try {
      const vault = await defiVaultContract() as any;
      const recipient = await connectedAddress();
      const routeUri = `arcpay://mantle/swap/${encodeURIComponent(form.agent)}?from=${form.from}&to=vault-credit&slippage=${form.maxSlippage}`;
      const tx = await vault.swapNativeToToken(recipient, routeUri, { value: toWei(form.amount) });
      setMessage(`Swap submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      saveIntent("mantle_swap_executed", receipt.hash);
      setMessage(`Live Mantle swap executed: ${receipt.hash}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setPending(false);
    }
  }

  async function copyPayload() {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setMessage("Copied Mantle swap intent payload.");
  }

  const reviewItems = [
    { label: "Route", value: `${form.from} -> ${form.to}` },
    { label: "Amount", value: form.amount },
    { label: "Slippage", value: `${form.maxSlippage}% max` },
    { label: "Adapter", value: form.adapter },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ArrowLeftRight}
        eyebrow="Mantle routing"
        title="Policy-checked swap intents"
        description="Build execution-ready Mantle swap requests with a strict testnet boundary: ArcPay vault execution is live on Mantle Sepolia; Agni Sepolia contracts are configured but require quote and tx evidence; other venues remain reference-only."
        actions={<button type="button" onClick={copyPayload} className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"><ClipboardCopy className="h-4 w-4" /> Copy route</button>}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard icon={RouteIcon} label="Intent type" value="Swap" hint="Wallet-signed" />
        <StatCard icon={ShieldCheck} label="Policy" value="Required" hint="Before execution" emphasis />
        <StatCard icon={Bot} label="Live rail" value="ArcPay vault" hint={shortAddress(CONTRACTS.ArcPayMantleDeFiVault)} />
        <StatCard icon={Workflow} label="Agni path" value="Configured" hint={shortAddress(AGNI_TESTNET_CONTRACTS.SwapRouter)} />
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <form className="rounded-3xl border border-border bg-card p-5 space-y-4" onSubmit={(event) => { event.preventDefault(); saveIntent(); }}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Route builder</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Create treasury route intent</h2>
            <p className="mt-1 text-sm text-muted-foreground">This is the safe handoff object an agent uses before touching liquidity.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="From asset"><input className="ap-in" value={form.from} onChange={(event) => setForm({ ...form, from: event.target.value })} /></Field>
            <Field label="To asset"><input className="ap-in" value={form.to} onChange={(event) => setForm({ ...form, to: event.target.value })} /></Field>
            <Field label="Amount"><input className="ap-in" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} inputMode="decimal" /></Field>
            <Field label="Max slippage %"><input className="ap-in" value={form.maxSlippage} onChange={(event) => setForm({ ...form, maxSlippage: event.target.value })} inputMode="decimal" /></Field>
            <Field label="Expiry minutes"><input className="ap-in" value={form.expiryMinutes} onChange={(event) => setForm({ ...form, expiryMinutes: event.target.value })} inputMode="numeric" /></Field>
            <Field label="Executor agent"><input className="ap-in" value={form.agent} onChange={(event) => setForm({ ...form, agent: event.target.value })} /></Field>
          </div>
          <Field label="Adapter">
            <select className="ap-in" value={form.adapter} onChange={(event) => setForm({ ...form, adapter: event.target.value })}>
              {ADAPTERS.map((adapter) => <option key={adapter.name}>{adapter.name}</option>)}
            </select>
          </Field>
          <Field label="Objective">
            <textarea className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm" value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} />
          </Field>
          <div className="flex flex-wrap gap-3">
            <button className="h-12 rounded-xl bg-primary px-5 font-semibold text-primary-foreground" type="submit">Save swap intent</button>
            <button className="h-12 rounded-xl bg-foreground px-5 font-semibold text-background disabled:opacity-60" type="button" disabled={pending || CONTRACTS.ArcPayMantleDeFiVault === "0x0000000000000000000000000000000000000000"} onClick={executeArcPaySwap}>
              {pending ? "Waiting for wallet..." : "Execute live MNT -> vault credit"}
            </button>
          </div>
          <div className="rounded-xl border border-border bg-muted p-3 text-sm text-muted-foreground">{message}</div>
        </form>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {ADAPTERS.map((adapter) => (
              <article key={adapter.name} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{adapter.status}</span>
                </div>
                <h3 className="mt-8 text-xl font-semibold tracking-tight">{adapter.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{adapter.description}</p>
              </article>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-[#101414] p-5 text-white">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Execution payload</div>
            <pre className="mt-4 max-h-[360px] overflow-auto rounded-2xl bg-black/35 p-4 text-xs leading-relaxed text-white/75">{JSON.stringify(payload, null, 2)}</pre>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/50">
              {reviewItems.map((item) => <span key={item.label}>{item.label}: {item.value}</span>)}
              <span>Policy {shortAddress(CONTRACTS.TreasuryPolicy)}</span>
              <span>Vault {shortAddress(CONTRACTS.ArcPayMantleDeFiVault)}</span>
              {message.startsWith("Live Mantle swap executed:") ? <a className="underline" href={txUrl(message.replace("Live Mantle swap executed: ", ""))} target="_blank" rel="noreferrer">Open tx</a> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
