-- ============================================================
-- CashTrack — Supabase schema (built-in OTP email verification)
-- Run this in the Supabase SQL Editor.
--
-- IMPORTANT: In Supabase Dashboard → Authentication → Providers
-- → Email, TURN OFF "Confirm email". CashTrack verifies email
-- via Supabase's built-in OTP (signInWithOtp / verifyOtp) and
-- only then creates the profile.
-- ============================================================

-- ---------- profiles (one row per auth user) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  role text not null check (role in ('student', 'parent', 'admin')),
  school text,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Users create their own profile row once their email is OTP-verified
create policy "profiles_insert_authenticated" on public.profiles
  for insert with check (auth.uid() = id);

-- ---------- wallets ----------
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade unique,
  balance numeric(14, 2) not null default 0,
  weekly_limit numeric(14, 2) not null default 5000,
  monthly_limit numeric(14, 2) not null default 18000,
  status text not null default 'active' check (status in ('active', 'frozen')),
  created_at timestamptz not null default now()
);

alter table public.wallets enable row level security;

create policy "wallets_owner" on public.wallets
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ---------- households (parent <-> child links) ----------
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references auth.users(id) on delete cascade,
  child_id uuid not null references auth.users(id) on delete cascade,
  underage boolean not null default false,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);

alter table public.households enable row level security;

create policy "households_participants" on public.households
  for select using (auth.uid() = parent_id or auth.uid() = child_id);

create policy "households_parent_insert" on public.households
  for insert with check (auth.uid() = parent_id);

-- ---------- transactions ----------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  merchant text not null,
  category text not null check (category in (
    'Food', 'Transport', 'School', 'Data', 'Accommodation',
    'Entertainment', 'Shopping', 'Health', 'Personal', 'Other', 'Income'
  )),
  amount numeric(14, 2) not null check (amount <> 0),  -- negative = expense, positive = income
  fee numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "transactions_owner" on public.transactions
  for select using (
    exists (
      select 1 from public.wallets w
      where w.id = transactions.wallet_id and w.owner_id = auth.uid()
    )
  );

create policy "transactions_owner_insert" on public.transactions
  for insert with check (
    exists (
      select 1 from public.wallets w
      where w.id = transactions.wallet_id and w.owner_id = auth.uid()
    )
  );

-- ---------- fee trigger: 1.5% per transaction, capped at N200 ----------
create or replace function public.compute_fee()
returns trigger
language plpgsql
security definer
as $$
begin
  new.fee := least(round(abs(new.amount) * 0.015, 2), 200);
  return new;
end;
$$;

drop trigger if exists trg_compute_fee on public.transactions;
create trigger trg_compute_fee
  before insert on public.transactions
  for each row execute function public.compute_fee();