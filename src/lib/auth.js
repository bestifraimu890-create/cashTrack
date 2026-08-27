import { supabase } from "../supabase/client.js";

// Creates the user's profile (+ wallet) from signup metadata if missing.
async function ensureProfile(user) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (existing?.role) return null;

  const m = user.user_metadata || {};
  const role = m.role === "parent" ? "parent" : m.role === "admin" ? "admin" : "student";

  if (!existing) {
    await supabase.from("profiles").upsert({
      id: user.id,
      first_name: m.first_name || "New",
      last_name: m.last_name || "User",
      role,
      school: m.school || null,
      phone: m.phone || null,
    }, { onConflict: "id" });
  }

  if (role === "parent") {
    const { data: hasWallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!hasWallet) {
      await supabase.from("wallets").upsert({ owner_id: user.id }, { onConflict: "owner_id" });
    }
  }
  return null;
}

export { ensureProfile };
