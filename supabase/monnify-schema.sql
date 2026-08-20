-- ============================================================
-- CashTrack — Monnify integration schema
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ---------- monnify_accounts: virtual NUBAN per parent wallet ----------
-- Created on demand when a parent first opens "Fund wallet".
-- Funding by transfer lands on Monnify and arrives via webhook.
create table if not exists public.monnify_accounts (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  account_name text not null,
  account_number text not null,
  bank_name text not null,
  monnify_reference text not null unique,
  created_at timestamptz not null default now()
);

alter table public.monnify_accounts enable row level security;

create policy "monnify_accounts_owner" on public.monnify_accounts
  for select using (
    exists (
      select 1 from public.wallets w
      where w.id = monnify_accounts.wallet_id and w.owner_id = auth.uid()
    )
  );

-- ---------- payouts: student withdrawal requests ----------
-- status flow: pending_otp -> processing -> completed
--              pending_otp -> failed (refunded)
--              pending_otp -> rejected (refunded)
-- Admin approves by submitting the Monnify OTP (sent to the app owner's email).
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  account_name text not null,
  account_number text not null,
  bank_code text not null,
  bank_name text,
  monnify_reference text,
  status text not null default 'pending_otp' check (status in
    ('pending_otp', 'processing', 'completed', 'failed', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payouts enable row level security;

-- Student sees their own requests; parent sees their children's; admin sees all.
create policy "payouts_select_owner_or_admin" on public.payouts
  for select using (
    exists (
      select 1 from public.wallets w
      where w.id = payouts.wallet_id and w.owner_id = auth.uid()
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
    or exists (
      select 1 from public.households h
      join public.wallets w on w.owner_id = h.child_id
      where w.id = payouts.wallet_id and h.parent_id = auth.uid()
    )
  );

-- Students request payouts from their own wallet.
create policy "payouts_insert_owner" on public.payouts
  for insert with check (
    exists (
      select 1 from public.wallets w
      where w.id = payouts.wallet_id and w.owner_id = auth.uid()
    )
  );

-- Only admins change status (approve/reject).
create policy "payouts_update_admin" on public.payouts
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create index if not exists payouts_wallet_idx on public.payouts (wallet_id);
create index if not exists payouts_status_idx on public.payouts (status);

-- ---------- monnify_webhooks: audit + idempotency ----------
-- Edge functions write here (service role); public has no access.
create table if not exists public.monnify_webhooks (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payment_reference text,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

alter table public.monnify_webhooks enable row level security;

create index if not exists monnify_webhooks_ref_idx
  on public.monnify_webhooks (payment_reference);

-- ---------- atomic balance helpers (webhooks / payouts) ----------
create or replace function public.credit_wallet(p_wallet_id uuid, p_amount numeric)
returns void
language plpgsql security definer as $$
begin
  update public.wallets set balance = balance + p_amount where id = p_wallet_id;
end;
$$;

create or replace function public.debit_wallet(p_wallet_id uuid, p_amount numeric)
returns boolean
language plpgsql security definer as $$
declare
  v_found boolean;
begin
  update public.wallets set balance = balance - p_amount
    where id = p_wallet_id and balance >= p_amount;
  v_found := found;
  return v_found;
end;
$$;