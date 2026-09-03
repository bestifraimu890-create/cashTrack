import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client.js";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      const type = params.get("type");

      if (hash && hash.includes("access_token")) {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) {
          window.dispatchEvent(new CustomEvent("signup-verified"));
          navigate("/signup", { replace: true });
          return;
        }
      }

      if (type === "signup") {
        window.dispatchEvent(new CustomEvent("signup-verified"));
        navigate("/signup", { replace: true });
        return;
      }

      navigate("/login", { replace: true });
    };

    handleAuth();
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
