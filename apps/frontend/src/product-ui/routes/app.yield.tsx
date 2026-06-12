"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Bot, CheckCircle2, ClipboardCopy, Landmark, ShieldCheck, TrendingUp, WalletCards, Workflow } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/primitives/StatCard";
import { connectedAddress, CONTRACTS, defiVaultContract, fromWei, shortAddress, toWei, txUrl, writeRecord } from "@mantle/lib/mantle";

export const Route = { options: { component: YieldRoute } };

const STRATEGIES = [
  { name: "MNT testnet vault", asset: "MNT", description: "Deposit and withdraw MNT in the deployed ArcPay Mantle Sepolia vault with wallet-signed tx evidence." },
  { name: "WMNT readiness check", asset: "WMNT", description: "Prepare WMNT route metadata using Mantle Sepolia token support without claiming external yield." },
  { name: "RealClaw evidence review", asset: "MNT", description: "Hand strategy instructions to a registered RealClaw agent and attach external venue tx evidence before completion." },
  { name: "Mainnet RWA watchlist", asset: "USDY/mETH", description: "Track Mantle mainnet RWA targets as non-testnet-live references until official Sepolia assets exist." },
] as const;

function YieldRoute() {
  const [form, setForm] = useState({
    strategy: "MNT testnet vault",
    asset: "MNT",
    amount: "0.01",
    target: "Prove live Mantle Testnet treasury yield controls without claiming unsupported partner yield.",
    maxDrawdown: "2",
    maxAllocation: "25",
    rebalanceCadence: "weekly",
    agent: "yield-strategy-agent",
  });
  const [message, setMessage] = useState("Create a governed Mantle yield request. ArcPay executes live MNT vault deposits on Mantle Testnet and keeps partner RWA routes evidence-only until official Sepolia support exists.");
  const [pending, setPending] = useState(false);
  const [position, setPosition] = useState<{ nativeBalance: string; tokenBalance: string; yieldPoints: string } | null>(null);

  const payload = useMemo(() => ({
    kind: "arcpay-mantle-yield-intent",
    chain: "mantle-testnet",
    strategy: form.strategy,
    asset: form.asset,
    amount: form.amount,
    target: form.target,
    risk: {
      maxDrawdownPercent: form.maxDrawdown,
      maxTreasuryAllocationPercent: form.maxAllocation,
      rebalanceCadence: form.rebalanceCadence,
      leverageAllowed: false,
      operatorApprovalRequired: true,
    },
    agent: form.agent,
    integrations: {
      realclaw: form.strategy.includes("RealClaw"),
      testnetVault: true,
      usdyCards: false,
      invoices: true,
      privacyIntents: true,
      mainnetReferenceOnly: ["USDY", "mETH", "Merchant Moe", "Agni", "Fluxion", "Aave V3"],
    },
    contracts: {
      policy: CONTRACTS.TreasuryPolicy,
      spendCards: CONTRACTS.AgentSpendCardVault,
      invoices: CONTRACTS.AgentInvoiceBook,
      privacyVault: CONTRACTS.MantlePrivacyVault,
      reputation: CONTRACTS.AgentReputationBook,
    },
  }), [form]);

  function saveIntent(status = form.strategy.includes("RealClaw") ? "realclaw_yield_intent_ready" : "mantle_yield_intent_ready", txHash?: string) {
    writeRecord({
      id: crypto.randomUUID(),
      type: "audit",
      title: `Yield strategy ${form.strategy}`,
      amount: `${form.amount} ${form.asset}`,
      status,
      txHash,
    });
    setMessage("Yield intent saved. Mantle Testnet completion requires ArcPay vault tx evidence or attached external venue proof.");
  }

  async function refreshPosition() {
    const vault = await defiVaultContract() as any;
    const account = await connectedAddress();
    const next = await vault.positions(account);
    setPosition({
      nativeBalance: fromWei(next.nativeBalance),
      tokenBalance: next.tokenBalance.toString(),
      yieldPoints: next.yieldPoints.toString(),
    });
  }

  async function depositLiveYield() {
    setPending(true);
    try {
      const vault = await defiVaultContract() as any;
      const strategyUri = `arcpay://mantle/yield/${encodeURIComponent(form.agent)}?strategy=${encodeURIComponent(form.strategy)}&asset=${form.asset}`;
      const tx = await vault.depositNativeYield(strategyUri, { value: toWei(form.amount) });
      setMessage(`Yield deposit submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      saveIntent("mantle_yield_deposited", receipt.hash);
      await refreshPosition();
      setMessage(`Live Mantle yield deposit recorded: ${receipt.hash}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setPending(false);
    }
  }

  async function withdrawLiveYield() {
    setPending(true);
    try {
      const vault = await defiVaultContract() as any;
      const account = await connectedAddress();
      const tx = await vault.withdrawNativeYield(toWei(form.amount), account);
      setMessage(`Yield withdraw submitted: ${tx.hash}`);
      const receipt = await tx.wait();
      saveIntent("mantle_yield_withdrawn", receipt.hash);
      await refreshPosition();
      setMessage(`Live Mantle yield withdrawal recorded: ${receipt.hash}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setPending(false);
    }
  }

  async function copyPayload() {
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setMessage("Copied Mantle yield strategy payload.");
  }

  const guardrails = [
    { label: "Asset", value: form.asset },
    { label: "Allocation cap", value: `${form.maxAllocation}%` },
    { label: "Drawdown cap", value: `${form.maxDrawdown}%` },
    { label: "Executor", value: form.agent },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        eyebrow="Mantle yield"
        title="Agent-managed testnet yield"
        description="Prepare policy-approved yield requests with explicit risk caps. ArcPay executes live MNT vault actions on Mantle Sepolia and keeps USDY/mETH as mainnet reference targets."
        actions={<button type="button" onClick={copyPayload} className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"><ClipboardCopy className="h-4 w-4" /> Copy strategy</button>}
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <StatCard icon={Landmark} label="Mantle thesis" value="Yield" hint="MNT testnet" emphasis />
        <StatCard icon={ShieldCheck} label="Policy" value="Required" hint="Before allocation" />
        <StatCard icon={WalletCards} label="Live vault" value={shortAddress(CONTRACTS.ArcPayMantleDeFiVault)} hint="Wallet-signed" />
        <StatCard icon={Bot} label="Position" value={position?.nativeBalance ?? "--"} hint="MNT deposited" />
      </div>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <form className="rounded-3xl border border-border bg-card p-5 space-y-4" onSubmit={(event) => { event.preventDefault(); saveIntent(); }}>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Strategy builder</div>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Create RWA/yield intent</h2>
            <p className="mt-1 text-sm text-muted-foreground">This creates the policy envelope an agent or operator must satisfy before execution.</p>
          </div>
          <Field label="Strategy">
            <select className="ap-in" value={form.strategy} onChange={(event) => {
              const strategy = STRATEGIES.find((item) => item.name === event.target.value);
              setForm({ ...form, strategy: event.target.value, asset: strategy?.asset ?? form.asset });
            }}>
              {STRATEGIES.map((strategy) => <option key={strategy.name}>{strategy.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Asset"><input className="ap-in" value={form.asset} onChange={(event) => setForm({ ...form, asset: event.target.value })} /></Field>
            <Field label="Amount"><input className="ap-in" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} inputMode="decimal" /></Field>
            <Field label="Max drawdown %"><input className="ap-in" value={form.maxDrawdown} onChange={(event) => setForm({ ...form, maxDrawdown: event.target.value })} inputMode="decimal" /></Field>
            <Field label="Max allocation %"><input className="ap-in" value={form.maxAllocation} onChange={(event) => setForm({ ...form, maxAllocation: event.target.value })} inputMode="decimal" /></Field>
            <Field label="Rebalance cadence"><input className="ap-in" value={form.rebalanceCadence} onChange={(event) => setForm({ ...form, rebalanceCadence: event.target.value })} /></Field>
            <Field label="Executor agent"><input className="ap-in" value={form.agent} onChange={(event) => setForm({ ...form, agent: event.target.value })} /></Field>
          </div>
          <Field label="Treasury objective">
            <textarea className="min-h-24 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm" value={form.target} onChange={(event) => setForm({ ...form, target: event.target.value })} />
          </Field>
          <div className="flex flex-wrap gap-3">
            <button className="h-12 rounded-xl bg-primary px-5 font-semibold text-primary-foreground" type="submit">Save yield intent</button>
            <button className="h-12 rounded-xl bg-foreground px-5 font-semibold text-background disabled:opacity-60" type="button" disabled={pending || CONTRACTS.ArcPayMantleDeFiVault === "0x0000000000000000000000000000000000000000"} onClick={depositLiveYield}>
              {pending ? "Waiting for wallet..." : "Deposit live MNT"}
            </button>
            <button className="h-12 rounded-xl border border-border px-5 font-semibold disabled:opacity-60" type="button" disabled={pending || CONTRACTS.ArcPayMantleDeFiVault === "0x0000000000000000000000000000000000000000"} onClick={withdrawLiveYield}>
              Withdraw MNT
            </button>
            <button className="h-12 rounded-xl border border-border px-5 font-semibold" type="button" onClick={refreshPosition}>Refresh position</button>
          </div>
          <div className="rounded-xl border border-border bg-muted p-3 text-sm text-muted-foreground">{message}</div>
        </form>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {STRATEGIES.map((strategy) => (
              <article key={strategy.name} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{strategy.asset}</span>
                </div>
                <h3 className="mt-8 text-xl font-semibold tracking-tight">{strategy.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{strategy.description}</p>
              </article>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            {guardrails.map((item) => (
              <article className="rounded-2xl border border-border bg-card p-4" key={item.label}>
                <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{item.label}</h3>
                <p className="mt-4 break-all text-lg font-semibold">{item.value}</p>
              </article>
            ))}
          </div>

          <div className="rounded-3xl border border-border bg-[#101414] p-5 text-white">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/45"><Workflow className="h-4 w-4" /> Strategy payload</div>
            <pre className="mt-4 max-h-[360px] overflow-auto rounded-2xl bg-black/35 p-4 text-xs leading-relaxed text-white/75">{JSON.stringify(payload, null, 2)}</pre>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/50">
              <span>Policy {shortAddress(CONTRACTS.TreasuryPolicy)}</span>
              <span>Vault {shortAddress(CONTRACTS.ArcPayMantleDeFiVault)}</span>
              <span>Privacy {shortAddress(CONTRACTS.MantlePrivacyVault)}</span>
              <span>Invoices {shortAddress(CONTRACTS.AgentInvoiceBook)}</span>
              {message.startsWith("Live Mantle yield") ? <a className="underline" href={txUrl(message.split(": ").at(-1) ?? "")} target="_blank" rel="noreferrer">Open tx</a> : null}
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
