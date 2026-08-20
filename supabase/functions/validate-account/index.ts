import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, json } from "../_shared/cors.ts";
import { monnifyApi } from "../_shared/monnify.ts";

/**
 * validate-account
 * - ?action=banks             → list of Monnify banks for the dropdown
 * - ?action=validate&accountNumber=...&bankCode=... → name enquiry
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

    const body = await req.json().catch(() => ({}));
    const action = body.action ?? "banks";

    if (action === "banks") {
      const data = await monnifyApi("/api/v1/banks");
      const banks = (data.responseBody ?? [])
        .map((b: any) => ({ code: b.code, name: b.name }))
        .sort((a: any, b: any) => a.name.localeCompare(b.name));
      return json({ banks });
    }

    if (action === "validate") {
      const accountNumber = String(body.accountNumber ?? "");
      const bankCode = String(body.bankCode ?? "");
      if (!/^\d{10}$/.test(accountNumber) || !bankCode) {
        return json({ error: "accountNumber (10 digits) and bankCode required" }, 400);
      }
      const data = await monnifyApi(
        `/api/v2/disbursements/account/validate?accountNumber=${accountNumber}&bankCode=${bankCode}`,
      );
      return json({ account: data.responseBody });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      500,
    );
  }
});