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

/* ---------------- signup verification gate ----------------
   PENDING_KEY holds the email waiting on magic-link verification.
   VERIFIED_KEY holds the last email proven via a clicked magic link.
   While a signup is pending, no route may send the user into the app —
   this closes the hole where signUp's instant session bounced users
   straight to a dashboard before they ever clicked the link. */

const PENDING_KEY = "cashtrack_pending_signup";
const VERIFIED_KEY = "cashtrack_signup_verified";

function getPendingSignupEmail() {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
    return pending?.email?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function getVerifiedEmail() {
  try {
    return (localStorage.getItem(VERIFIED_KEY) || "").toLowerCase() || null;
  } catch {
    return null;
  }
}

// True when a signup is still waiting on its magic-link click.
function isSignupPending() {
  const pending = getPendingSignupEmail();
  if (!pending) return false;
  return getVerifiedEmail() !== pending;
}

// True when this exact email still owes us a magic-link click.
function needsVerification(email) {
  const pending = getPendingSignupEmail();
  if (!pending) return false;
  return pending === (email || "").trim().toLowerCase() && getVerifiedEmail() !== pending;
}

function markEmailVerified(email) {
  try {
    localStorage.setItem(VERIFIED_KEY, email ?? "");
  } catch {
    /* ignore storage errors */
  }
}

function markSignupComplete(email) {
  try {
    localStorage.removeItem(PENDING_KEY);
    if (email) localStorage.setItem(VERIFIED_KEY, email);
  } catch {
    /* ignore storage errors */
  }
}

export {
  PENDING_KEY,
  VERIFIED_KEY,
  isSignupPending,
  needsVerification,
  markEmailVerified,
  markSignupComplete,
};
