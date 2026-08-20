import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, json } from "../_shared/cors.ts";

/**
 * update-child-limits — parent sets weekly/monthly withdrawal limits on a
 * linked child's wallet. RLS keeps clients from touching other wallets, so
 * this runs with the service role after verifying the household link.
 * Body: { childId, weeklyLimit?, monthlyLimit? }
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
      return json({ error: "Only parents can set limits" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const childId = String(body.childId ?? "");

    const { data: link } = await supabase
      .from("households")
      .select("child_id")
      .eq("parent_id", auth.user.id)
      .eq("child_id", childId)
      .maybeSingle();
    if (!link) return json({ error: "Not your child" }, 403);

    const { data: childWallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("owner_id", childId)
      .maybeSingle();
    if (!childWallet) return json({ error: "Child has no wallet yet" }, 404);

    const patch: Record<string, number> = {};
    if (body.weeklyLimit !== undefined) {
      const w = Number(body.weeklyLimit);
      if (!w || w <= 0) return json({ error: "Weekly limit must be positive" }, 400);
      patch.weekly_limit = w;
    }
    if (body.monthlyLimit !== undefined) {
      const m = Number(body.monthlyLimit);
      if (!m || m <= 0) return json({ error: "Monthly limit must be positive" }, 400);
      patch.monthly_limit = m;
    }
    if (Object.keys(patch).length === 0) {
      return json({ error: "Provide weeklyLimit and/or monthlyLimit" }, 400);
    }

    const { error } = await supabase
      .from("wallets")
      .update(patch)
      .eq("id", childWallet.id);
    if (error) throw error;

    return json({ updated: patch });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      500,
    );
  }
});