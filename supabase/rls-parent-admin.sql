-- EMERGENCY FIX: Drop all broken RLS policies and recreate safe ones
-- Run this in Supabase SQL Editor NOW

-- Drop ALL policies I added that might be causing recursion
drop policy if exists "profiles_parent_see_children" on public.profiles;
drop policy if exists "profiles_child_see_parent" on public.profiles;
drop policy if exists "profiles_admin_select" on public.profiles;
drop policy if exists "profiles_admin_all" on public.profiles;
drop policy if exists "wallets_parent_see_children" on public.wallets;
drop policy if exists "wallets_parent_update_children" on public.wallets;
drop policy if exists "wallets_admin_all" on public.wallets;
drop policy if exists "transactions_parent_see_children" on public.transactions;
drop policy if exists "transactions_admin_all" on public.transactions;
drop policy if exists "households_admin_all" on public.households;
drop policy if exists "payouts_parent_update" on public.payouts;

-- Drop the helper function
drop function if exists public.user_role();

-- Now recreate ONLY the safe parent-child policies (no recursion)
-- These work because they query HOUSEHOLDS, not the same table

-- Parent can see children's profiles (queries households, not profiles recursively)
create policy "profiles_parent_see_children" on public.profiles
  for select using (
    exists (
      select 1 from public.households h
      where h.parent_id = auth.uid() and h.child_id = profiles.id
    )
  );

-- Child can see parent's profile
create policy "profiles_child_see_parent" on public.profiles
  for select using (
    exists (
      select 1 from public.households h
      where h.child_id = auth.uid() and h.parent_id = profiles.id
    )
  );

-- Parent can see children's wallets
create policy "wallets_parent_see_children" on public.wallets
  for select using (
    exists (
      select 1 from public.households h
      where h.parent_id = auth.uid() and h.child_id = wallets.owner_id
    )
  );

-- Parent can update children's wallets
create policy "wallets_parent_update_children" on public.wallets
  for update using (
    exists (
      select 1 from public.households h
      where h.parent_id = auth.uid() and h.child_id = wallets.owner_id
    )
  );

-- Parent can see children's transactions
create policy "transactions_parent_see_children" on public.transactions
  for select using (
    exists (
      select 1 from public.wallets w
      join public.households h on h.child_id = w.owner_id
      where w.id = transactions.wallet_id and h.parent_id = auth.uid()
    )
  );

-- Parent can update child payouts
create policy "payouts_parent_update" on public.payouts
  for update using (
    exists (
      select 1 from public.wallets w
      join public.households h on h.child_id = w.owner_id
      where w.id = payouts.wallet_id and h.parent_id = auth.uid()
    )
  );
