-- ============================================================
-- CashTrack — RLS policies for parent + admin read access
-- Run this in the Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ---------- profiles ----------

-- Parent can see their children's profiles
drop policy if exists "profiles_parent_see_children" on public.profiles;
create policy "profiles_parent_see_children" on public.profiles
  for select using (
    exists (
      select 1 from public.households h
      where h.parent_id = auth.uid() and h.child_id = profiles.id
    )
  );

-- Child can see their parent's profile (for name display)
drop policy if exists "profiles_child_see_parent" on public.profiles;
create policy "profiles_child_see_parent" on public.profiles
  for select using (
    exists (
      select 1 from public.households h
      where h.child_id = auth.uid() and h.parent_id = profiles.id
    )
  );

-- Admin can see all profiles
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------- wallets ----------

-- Parent can see their children's wallets
drop policy if exists "wallets_parent_see_children" on public.wallets;
create policy "wallets_parent_see_children" on public.wallets
  for select using (
    exists (
      select 1 from public.households h
      where h.parent_id = auth.uid() and h.child_id = wallets.owner_id
    )
  );

-- Parent can update children's wallets (for send-to-child)
drop policy if exists "wallets_parent_update_children" on public.wallets;
create policy "wallets_parent_update_children" on public.wallets
  for update using (
    exists (
      select 1 from public.households h
      where h.parent_id = auth.uid() and h.child_id = wallets.owner_id
    )
  );

-- Admin can see all wallets
drop policy if exists "wallets_admin_all" on public.wallets;
create policy "wallets_admin_all" on public.wallets
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------- transactions ----------

-- Parent can see their children's transactions
drop policy if exists "transactions_parent_see_children" on public.transactions;
create policy "transactions_parent_see_children" on public.transactions
  for select using (
    exists (
      select 1 from public.wallets w
      join public.households h on h.child_id = w.owner_id
      where w.id = transactions.wallet_id and h.parent_id = auth.uid()
    )
  );

-- Admin can see all transactions
drop policy if exists "transactions_admin_all" on public.transactions;
create policy "transactions_admin_all" on public.transactions
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------- households ----------

-- Admin can see all households
drop policy if exists "households_admin_all" on public.households;
create policy "households_admin_all" on public.households
  for all using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ---------- payouts ----------

-- Parent can update child payouts (approve/reject)
drop policy if exists "payouts_parent_update" on public.payouts;
create policy "payouts_parent_update" on public.payouts
  for update using (
    exists (
      select 1 from public.wallets w
      join public.households h on h.child_id = w.owner_id
      where w.id = payouts.wallet_id and h.parent_id = auth.uid()
    )
  );
