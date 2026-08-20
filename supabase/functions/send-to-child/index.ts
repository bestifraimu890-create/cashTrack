import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, json } from "../_shared/cors.ts";

/**
 * send-to-child — parent moves money from their wallet to a linked child's
 * wallet (internal transfer, no Monnify call). Both ledgers record it.
 * Body: { childId, amount, note? }
 */
Deno.serve(async (req) => {
  const opts = handleOptions(req);
  if (opts) return opts;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const { data: auth, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );
    if (authError || !auth.user) return json({ error: "Unauthorized" }, 401);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (!profile || profile.role !== "parent") {
      return json({ error: "Only parents can send money to children" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const childId = String(body.childId ?? "");
    const amount = Number(body.amount);
    const note = String(body.note ?? "").slice(0, 100);

    if (!childId || !amount || amount <= 0) {
      return json({ error: "childId and a valid amount are required" }, 400);
    }

    // Must be a linked child
    const { data: link } = await supabase
      .from("households")
      .select("child_id")
      .eq("parent_id", auth.user.id)
      .eq("child_id", childId)
      .maybeSingle();
    if (!link) return json({ error: "Not your child" }, 403);

    // Parent wallet (auto-create so new flows never 404)
    let { data: parentWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("owner_id", auth.user.id)
      .maybeSingle();
    if (!parentWallet) {
      const { data: created } = await supabase
        .from("wallets")
        .insert({ owner_id: auth.user.id })
        .select()
        .single();
      parentWallet = created;
    }

    // Child wallet (auto-create too)
    let { data: childWallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("owner_id", childId)
      .maybeSingle();
    if (!childWallet) {
      const { data: created } = await supabase
        .from("wallets")
        .insert({ owner_id: childId })
        .select()
        .single();
      childWallet = created;
    }

    if (Number(parentWallet.balance) < amount) {
      return json({ error: "Insufficient balance in your wallet" }, 400);
    }

    const debited = await supabase.rpc("debit_wallet", {
      p_wallet_id: parentWallet.id,
      p_amount: amount,
    });
    if (debited.error || debited.data === false) {
      return json({ error: "Could not reserve funds" }, 400);
    }

    await supabase.rpc("credit_wallet", {
      p_wallet_id: childWallet.id,
      p_amount: amount,
    });

    await supabase.from("transactions").insert([
      {
        wallet_id: parentWallet.id,
        merchant: "Transfer to child",
        category: "Other",
        amount: -amount,
      },
      {
        wallet_id: childWallet.id,
        merchant: note || "Parent top-up",
        category: "Income",
        amount,
      },
    ]);

    return json({ sent: true, amount });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      500,
    );
  }
});