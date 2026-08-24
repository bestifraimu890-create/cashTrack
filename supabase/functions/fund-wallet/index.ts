import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, json } from "../_shared/cors.ts";
import { getContractCode, monnifyApi } from "../_shared/monnify.ts";

/**
 * fund-wallet
 * - action=reserve  → get/create the parent's dedicated virtual NUBAN (transfer top-ups)
 * - action=checkout → start a card/transfer/USSD payment, returns Monnify checkoutUrl
 * Body: { action, amount?, redirectUrl? }
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
      .select("role, first_name, last_name")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (!profile || !["parent", "admin"].includes(profile.role)) {
      return json({ error: "Only parents can fund a wallet" }, 403);
    }

    let { data: wallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("owner_id", auth.user.id)
      .maybeSingle();
    if (!wallet) {
      const { data: created } = await supabase
        .from("wallets")
        .insert({ owner_id: auth.user.id })
        .select()
        .single();
      wallet = created;
    }
    if (!wallet) return json({ error: "Could not create wallet" }, 500);

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "reserve";

    if (action === "reserve") {
      const { data: existing } = await supabase
        .from("monnify_accounts")
        .select("*")
        .eq("wallet_id", wallet.id)
        .maybeSingle();
      if (existing) return json({ account: existing });

      const fullName = `${profile.first_name} ${profile.last_name}`.trim();
      const accountRef = `CT-${wallet.id}`;

      let data;
      try {
        data = await monnifyApi("/api/v2/bank-transfer/reserved-accounts", {
          method: "POST",
          body: JSON.stringify({
            accountReference: accountRef,
            accountName: `CashTrack ${fullName}`,
            currencyCode: "NGN",
            contractCode: getContractCode(),
            customerEmail: auth.user.email,
            customerName: fullName,
            getAllAvailableBanks: false,
            preferredBanks: ["035", "058", "044", "011", "232", "063"],
          }),
        });
      } catch (reserveErr) {
        const msg = reserveErr instanceof Error ? reserveErr.message : "";
        if (msg.includes("cannot reserve more than 1")) {
          // Account already exists on Monnify but with a different reference.
          // Try common reference patterns to retrieve it.
          const refsToTry = [
            accountRef,
            auth.user.email,
            `CTW-${wallet.id}`,
            `${wallet.id}`,
          ];
          let found = false;
          for (const ref of refsToTry) {
            try {
              data = await monnifyApi(
                `/api/v2/bank-transfer/reserved-accounts/${encodeURIComponent(ref)}`,
                { method: "GET" },
              );
              if (data.responseBody?.accounts?.[0]?.accountNumber) {
                found = true;
                break;
              }
            } catch {
              // try next reference
            }
          }
          if (!found) {
            return json(
              {
                error:
                  "You already have a reserved account on Monnify. Please contact support to retrieve your existing account details.",
              },
              409,
            );
          }
        } else {
          throw reserveErr;
        }
      }

      const acc = data.responseBody?.accounts?.[0] ?? data.responseBody;
      if (!acc || !acc.accountNumber) throw new Error("Monnify returned no virtual account");

      const { data: row, error: insErr } = await supabase
        .from("monnify_accounts")
        .insert({
          wallet_id: wallet.id,
          account_name: acc.accountName ?? `CashTrack ${fullName}`,
          account_number: acc.accountNumber,
          bank_name: acc.bankName ?? "Wema Bank",
          monnify_reference: data.responseBody?.reservationReference ?? data.responseBody?.reference ?? accountRef,
        })
        .select()
        .single();
      if (insErr) throw insErr;

      return json({ account: row });
    }

    if (action === "checkout") {
      const amount = Number(body.amount);
      if (!amount || amount <= 0) {
        return json({ error: "A valid amount is required" }, 400);
      }
      const fullName = `${profile.first_name} ${profile.last_name}`.trim();
      const paymentReference = `CTW-${wallet.id}-${Date.now()}`;
      const data = await monnifyApi(
        "/api/v1/merchant/transactions/init-transaction",
        {
          method: "POST",
          body: JSON.stringify({
            amount,
            customerName: fullName,
            customerEmail: auth.user.email,
            paymentReference,
            paymentDescription: "CashTrack wallet top-up",
            currencyCode: "NGN",
            contractCode: getContractCode(),
            redirectUrl: body.redirectUrl ?? "",
            paymentMethods: ["CARD", "ACCOUNT_TRANSFER", "USSD", "PHONE_NUMBER"],
            metaData: { walletId: wallet.id },
          }),
        },
      );
      return json({
        checkoutUrl: data.responseBody?.checkoutUrl,
        paymentReference: data.responseBody?.paymentReference ?? paymentReference,
      });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      500,
    );
  }
});