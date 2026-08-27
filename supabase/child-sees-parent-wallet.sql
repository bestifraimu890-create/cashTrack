CREATE POLICY "wallets_child_see_parent" ON public.wallets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM households h
      WHERE h.child_id = auth.uid()
        AND h.parent_id = wallets.owner_id
    )
  );
