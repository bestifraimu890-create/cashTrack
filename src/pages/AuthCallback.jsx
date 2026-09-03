import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client.js";
import { ensureProfile, markEmailVerified } from "../lib/auth.js";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams(window.location.search);

        // PKCE flow (?code=...) — exchange it for a session
        if (params.get("code")) {
          await supabase.auth.exchangeCodeForSession(params.get("code"));
        }

        // Hash flow (#access_token=...) is picked up automatically by the client
        const { data } = await supabase.auth.getSession();
        const sessionUser = data.session?.user ?? null;

        if (sessionUser) {
          // Create the profile (with the role chosen at signup) BEFORE
          // routing, so /app sends parents to /parent and students to /student.
          try {
            await ensureProfile(sessionUser);
          } catch {
            /* profile creation is best-effort here; RoleRouter retries the lookup */
          }
          markEmailVerified(sessionUser.email ?? "");
          // Pure verification: sign back out so the dashboard stays gated
          // behind password login. The signup page picks up the verified
          // flag and offers "Continue to Log In".
          await supabase.auth.signOut();
          navigate("/signup", { replace: true });
          return;
        }

        if (params.get("type") === "signup") {
          navigate("/signup", { replace: true });
          return;
        }
      } catch {
        /* fall through to login */
      }
      navigate("/login", { replace: true });
    })();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Verifying your email…</p>
      </div>
    </div>
  );
}
