create table if not exists public.arcpay_mantle_records (
  id uuid primary key,
  owner text not null,
  type text not null,
  title text not null,
  status text not null,
  amount text,
  tx_hash text,
  created_at timestamptz not null default now()
);

create index if not exists arcpay_mantle_records_owner_created_idx
on public.arcpay_mantle_records (owner, created_at desc);

alter table public.arcpay_mantle_records enable row level security;

drop policy if exists "Service role manages Mantle records" on public.arcpay_mantle_records;

create policy "Service role manages Mantle records"
on public.arcpay_mantle_records
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
