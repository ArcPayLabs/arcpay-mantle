# ArcPay Mantle Worker

`apps/worker` is the Azure-ready event reconciler for Mantle.

It backfills and polls:

- `AgentRegistry` registration and update events
- `TreasuryPolicy` policy, allowlist, approval, and spend events
- `AgentTreasury` escrow deposit, settlement, and refund events
- `AgentOrderBook` order lifecycle events
- `AgentSpendCardVault` USDY card events
- `OperatorControls` claim-code and webhook-circuit events
- `MantlePrivacyVault` MNT/USDY privacy intent events
- `AgentInvoiceBook` MNT/USDY invoice creation, payment, and cancellation events
- `MantleAgentRiskOracle` risk request and fulfillment events

## Run Locally

```bash
npm run install:worker
npm run worker
```

One-shot verification:

```bash
npm run worker:once
```

## Azure App Service / VM

Set:

```bash
MANTLE_RPC_URL=https://rpc.sepolia.mantle.xyz
ARCPAY_ROOT=/path/to/arcpay-mantle
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
ARCPAY_RECORDS_TABLE=arcpay_mantle_records
ARCPAY_WORKER_CHECKPOINT_PATH=/home/arcpay/.arcpay-mantle-worker-checkpoint.json
```

Start command:

```bash
npm run worker
```

The worker writes structured records into Supabase when `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` are set. Without Supabase it prints the same records
as structured JSON logs.

Each indexed event is idempotent by chain, contract, transaction hash, and log
index. The checkpoint file lets the worker resume from the last scanned Mantle
block after a restart.

Current VM deployment uses a systemd service:

```bash
sudo systemctl status arcpay-mantle-worker --no-pager
sudo journalctl -u arcpay-mantle-worker -n 50 --no-pager
sudo systemctl restart arcpay-mantle-worker
```

The service runs from `/home/arcpay/arcpay-mantle` and restarts automatically
after VM reboot.

Dashboard and Audit pages fetch `/api/records`, so worker-reconciled events
appear in the product UI alongside browser-created records.
