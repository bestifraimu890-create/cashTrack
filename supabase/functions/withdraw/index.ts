import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, json } from "../_shared/cors.ts";
import { getSourceAccount, monnifyApi } from "../_shared/monnify.ts";

/**
 * withdraw — student requests money out of their wallet.
 * Server-side checks (non-negotiable):
 *   1. wallet active
 *   2. balance >= amount
 *   3. weeklySpent + amount <= weekly_limit
 *   4. monthlySpent + amount <= monthly_limit
 * Funds are reserved immediately (debit). Monnify sends an OTP to the app
 * owner's email; an admin enters it via confirm-payout to authorize.
 * Body: { amount, accountNumber, bankCode, bankName }
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
    if (!profile || profile.role !== "student") {
      return json({ error: "Only students can request withdrawals" }, 403);
    }

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("owner_id", auth.user.id)
      .maybeSingle();
    if (!wallet) return json({ error: "No wallet for this account" }, 404);
    if (wallet.status !== "active") {
      return json({ error: "This wallet is frozen" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const accountNumber = String(body.accountNumber ?? "").trim();
    const bankCode = String(body.bankCode ?? "").trim();
    const bankName = String(body.bankName ?? "").trim();

    if (!amount || amount <= 0) return json({ error: "Valid amount required" }, 400);
    if (!/^\d{10}$/.test(accountNumber)) {
      return json({ error: "Account number must be 10 digits" }, 400);
    }
    if (!bankCode) return json({ error: "Bank required" }, 400);

    // --- limit checks ---
    if (Number(wallet.balance) < amount) {
      return json({ error: "Insufficient balance" }, 400);
    }

    const since = (days: number) =>
      new Date(Date.now() - days * 86400000).toISOString();

    const { data: weekTx } = await supabase
      .from("transactions")
      .select("amount")
      .eq("wallet_id", wallet.id)
      .lt("amount", 0)
      .gte("created_at", since(7));
    const weeklySpent = (weekTx ?? []).reduce(
      (s: number, t: any) => s + Math.abs(Number(t.amount)),
      0,
    );
    if (weeklySpent + amount > Number(wallet.weekly_limit)) {
      return json(
        {
          error: `Exceeds weekly limit. Spent ₦${weeklySpent.toLocaleString()} of ₦${Number(wallet.weekly_limit).toLocaleString()}`,
        },
        400,
      );
    }

    const { data: monthTx } = await supabase
      .from("transactions")
      .select("amount")
      .eq("wallet_id", wallet.id)
      .lt("amount", 0)
      .gte("created_at", since(30));
    const monthlySpent = (monthTx ?? []).reduce(
      (s: number, t: any) => s + Math.abs(Number(t.amount)),
      0,
    );
    if (monthlySpent + amount > Number(wallet.monthly_limit)) {
      return json(
        {
          error: `Exceeds monthly limit. Spent ₦${monthlySpent.toLocaleString()} of ₦${Number(wallet.monthly_limit).toLocaleString()}`,
        },
        400,
      );
    }

    // --- daily approval threshold check ---
    if (wallet.require_approval && wallet.approval_threshold > 0) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: todayPayouts } = await supabase
        .from("payouts")
        .select("amount")
        .eq("wallet_id", wallet.id)
        .gte("created_at", todayStart.toISOString())
        .not("status", "in", "(failed,rejected)");
      const todayTotal = (todayPayouts ?? []).reduce(
        (s: number, p: any) => s + Number(p.amount),
        0,
      );
      if (todayTotal + amount > Number(wallet.approval_threshold)) {
        return json(
          {
            error: `Exceeds daily approval threshold of ₦${Number(wallet.approval_threshold).toLocaleString()}. You've already withdrawn ₦${todayTotal.toLocaleString()} today.`,
          },
          400,
        );
      }
    }

    // --- name enquiry (fresh, server-side) ---
    const enquiry = await monnifyApi(
      `/api/v2/disbursements/account/validate?accountNumber=${accountNumber}&bankCode=${bankCode}`,
    );
    const accountName: string = enquiry.responseBody?.accountName ?? "";

    // --- create payout record + reserve funds ---
    const { data: payout, error: payErr } = await supabase
      .from("payouts")
      .insert({
        wallet_id: wallet.id,
        amount,
        account_name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        bank_name: bankName || null,
        status: "pending_otp",
      })
      .select()
      .single();
    if (payErr) throw payErr;

    const debited = await supabase.rpc("debit_wallet", {
      p_wallet_id: wallet.id,
      p_amount: amount,
    });
    if (debited.error || debited.data === false) {
      await supabase
        .from("payouts")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", payout.id);
      return json({ error: "Could not reserve funds" }, 400);
    }

    // --- initiate the Monnify transfer (returns PENDING_AUTHORIZATION) ---
    const reference = `CTP-${payout.id}`;
    try {
      await monnifyApi("/api/v2/disbursements/single", {
        method: "POST",
        body: JSON.stringify({
          amount,
          reference,
          narration: "CashTrack student withdrawal",
          destinationBankCode: bankCode,
          destinationAccountNumber: accountNumber,
          destinationAccountName: accountName,
          currency: "NGN",
          sourceAccountNumber: getSourceAccount(),
        }),
      });
    } catch (e) {
      // Refund and fail the request
      await supabase.rpc("credit_wallet", {
        p_wallet_id: wallet.id,
        p_amount: amount,
      });
      await supabase
        .from("payouts")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", payout.id);
      return json(
        { error: e instanceof Error ? e.message : "Monnify rejected the transfer" },
        502,
      );
    }

    await supabase
      .from("payouts")
      .update({ monnify_reference: reference, updated_at: new Date().toISOString() })
      .eq("id", payout.id);

    return json({
      payoutId: payout.id,
      status: "pending_otp",
      message: "Request submitted. An OTP has been sent to the app owner for approval.",
    });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      500,
    );
  }
});