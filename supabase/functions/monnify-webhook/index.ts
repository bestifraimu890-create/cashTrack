import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { json } from "../_shared/cors.ts";

/**
 * monnify-webhook — receives Monnify notifications.
 * - SUCCESSFUL_TRANSACTION     → credit the parent wallet (funding top-up)
 * - SUCCESSFUL_DISBURSEMENT    → mark payout completed, record the expense
 * - FAILED_DISBURSEMENT        → refund the wallet, mark payout failed
 *
 * Signature: HMAC-SHA512(secretKey, raw body) vs `monnify-signature` header.
 * Sandbox does NOT send the header — set MONNIFY_WEBHOOK_INSECURE=true there.
 */
function verifySignature(secret: string, bodyText: string, signature: string | null): Promise<boolean> {
  if (!signature) return Promise.resolve(false);
  const key = new TextEncoder().encode(secret);
  const msg = new TextEncoder().encode(bodyText);
  return crypto.subtle
    .importKey("raw", key, { name: "HMAC", hash: "SHA-512" }, false, ["sign"])
    .then((k) => crypto.subtle.sign("HMAC", k, msg))
    .then((sig) => {
      const hex = Array.from(new Uint8Array(sig))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return hex === signature;
    });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const bodyText = await req.text();
  const secret = Deno.env.get("MONNIFY_SECRET_KEY") ?? "";
  const signature = req.headers.get("monnify-signature");
  const insecure = Deno.env.get("MONNIFY_WEBHOOK_INSECURE") === "true";

  if (!insecure) {
    const ok = await verifySignature(secret, bodyText, signature);
    if (!ok) return json({ error: "Bad signature" }, 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const eventType: string = payload.eventType ?? "";
  const eventData: any = payload.eventData ?? {};
  const paymentReference: string | null =
    eventData.paymentReference ?? eventData.reference ?? null;

  // Idempotency: never process the same Monnify reference twice.
  if (paymentReference) {
    const { data: dup } = await supabase
      .from("monnify_webhooks")
      .select("id")
      .eq("payment_reference", paymentReference)
      .maybeSingle();
    if (dup) return json({ received: true, duplicate: true });
  }

  await supabase.from("monnify_webhooks").insert({
    event_type: eventType,
    payment_reference: paymentReference,
    payload,
  });

  if (eventType === "SUCCESSFUL_TRANSACTION") {
    // -------- funding top-up: credit the parent wallet --------
    const walletId =
      eventData.metaData?.walletId ??
      (paymentReference ?? "").split("-")[1];
    if (!walletId) return json({ received: true, note: "no walletId" });
    const amount = Number(eventData.amountPaid ?? eventData.settlementAmount ?? 0);
    if (amount <= 0) return json({ received: true, note: "zero amount" });

    const { data: wallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("id", walletId)
      .maybeSingle();
    if (!wallet) return json({ received: true, note: "wallet not found" });

    await supabase.rpc("credit_wallet", {
      p_wallet_id: walletId,
      p_amount: amount,
    });
    await supabase.from("transactions").insert({
      wallet_id: walletId,
      merchant: "Monnify Top-up",
      category: "Income",
      amount,
    });
    return json({ received: true, credited: true });
  }

  if (eventType === "SUCCESSFUL_DISBURSEMENT") {
    // -------- payout landed: mark completed + record expense --------
    const ref = eventData.reference;
    const { data: payout } = await supabase
      .from("payouts")
      .select("*")
      .eq("monnify_reference", ref)
      .maybeSingle();
    if (payout && payout.status !== "completed") {
      await supabase
        .from("payouts")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", payout.id);
      await supabase.from("transactions").insert({
        wallet_id: payout.wallet_id,
        merchant: "Monnify Withdrawal",
        category: "Personal",
        amount: -payout.amount,
      });
    }
    return json({ received: true, completed: true });
  }

  if (eventType === "FAILED_DISBURSEMENT" || eventType === "REVERSED_TRANSACTION") {
    // -------- payout failed: refund the wallet --------
    const ref = eventData.reference;
    const { data: payout } = await supabase
      .from("payouts")
      .select("*")
      .eq("monnify_reference", ref)
      .maybeSingle();
    if (payout && payout.status !== "failed") {
      await supabase.rpc("credit_wallet", {
        p_wallet_id: payout.wallet_id,
        p_amount: payout.amount,
      });
      await supabase
        .from("payouts")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("id", payout.id);
    }
    return json({ received: true, refunded: true });
  }

  return json({ received: true, eventType });
});