import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, json } from "../_shared/cors.ts";

/**
 * link-child — parent enters a student's connection ID to link them.
 * Body: { connectionId }
 * Creates a households row so the parent can see and fund the student.
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
      return json({ error: "Only parents can link children" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const connectionId = String(body.connectionId ?? "").trim().toUpperCase();
    if (!connectionId || connectionId.length < 4) {
      return json({ error: "Enter a valid connection ID" }, 400);
    }

    // Find the student by connection_id
    const { data: student } = await supabase
      .from("profiles")
      .select("id, role, first_name, last_name")
      .eq("connection_id", connectionId)
      .maybeSingle();
    if (!student) return json({ error: "No account found with that connection ID" }, 404);
    if (student.role !== "student") {
      return json({ error: "That connection ID belongs to a non-student account" }, 400);
    }
    if (student.id === auth.user.id) {
      return json({ error: "You cannot link your own account" }, 400);
    }

    // Check if already linked
    const { data: existing } = await supabase
      .from("households")
      .select("id")
      .eq("parent_id", auth.user.id)
      .eq("child_id", student.id)
      .maybeSingle();
    if (existing) return json({ error: "Already linked to this student" }, 409);

    // Create the link
    const { error: linkErr } = await supabase.from("households").insert({
      parent_id: auth.user.id,
      child_id: student.id,
    });
    if (linkErr) throw linkErr;

    return json({
      linked: true,
      child: { id: student.id, name: `${student.first_name} ${student.last_name}` },
    });
  } catch (e) {
    return json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      500,
    );
  }
});