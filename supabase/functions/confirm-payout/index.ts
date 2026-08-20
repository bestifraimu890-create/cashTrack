import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, json } from "../_shared/cors.ts";
import { monnifyApi } from "../_shared/monnify.ts";

/**
 * confirm-payout — admin-only.
 * - action=approve { payoutId, otp } → authorize the transfer with the OTP
 *   Monnify emailed to the app owner (MFA).
 * - action=resend   { payoutId }     → ask Monnify to resend that OTP.
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
    if (!profile || profile.role !== "admin") {
      return json({ error: "Admins only" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const payoutId = String(body.payoutId ?? "");
    if (!payoutId) return json({ error: "payoutId required" }, 400);

    const { data: payout } = await supabase
      .from("payouts")
      .select("*")
      .eq("id", payoutId)
      .maybeSingle();
    if (!payout) return json({ error: "Payout not found" }, 404);
    if (payout.status !== "pending_otp") {
      return json({ error: `Payout is ${payout.status}, not awaiting OTP` }, 400);
    }
    if (!payout.monnify_reference) {
      return json({ error: "Payout was never initiated" }, 400);
    }

    const action = body.action ?? "approve";

    if (action === "approve") {
      const otp = String(body.otp ?? "").trim();
      if (!/^\d+$/.test(otp)) return json({ error: "OTP required" }, 400);

      const data = await monnifyApi(
        "/api/v2/disbursements/single/validate-otp",
        {
          method: "POST",
          body: JSON.stringify({
            reference: payout.monnify_reference,
            authorizationCode: otp,
          }),
        },
      );

      await supabase
        .from("payouts")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", payout.id);

      return json({
        approved: true,
        monnifyStatus: data.responseBody?.transactionStatus ?? "processing",
      });
    }

    if (action === "resend") {
      await monnifyApi("/api/v2/disbursements/single/resend-otp", {
        method: "POST",
        body: JSON.stringify({ reference: payout.monnify_reference }),
      });
      return json({ resent: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      500,
    );
  }
});