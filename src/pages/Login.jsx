import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabase/client.js";
import { ensureProfile } from "../lib/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import { AuthShell } from "../components/layout/AuthShell.jsx";
import { ErrorBanner, LoadingButton } from "../components/common/index.js";

export default function Login({ error: appError }) {
  const navigate = useNavigate();
  const { setRole } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(appError || "");
  const [loading, setLoading] = useState(false);

  // Already has a session — finish setup if needed and route in
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active || !data.session) return;
      const user = data.session.user;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      if (profile?.role) {
        setRole(profile.role);
        navigate("/app", { replace: true });
      } else {
        await ensureProfile(user);
        if (!active) return;
        navigate("/app", { replace: true });
      }
    });
    return () => { active = false; };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      if (!data.user) throw new Error("Could not sign you in. Please try again.");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      if (!profile?.role) {
        await ensureProfile(data.user);
      } else {
        setRole(profile.role);
      }
      navigate("/app", { replace: true });
    } catch (err) {
      if (err.message?.toLowerCase().includes("invalid login credentials")) {
        setError("Wrong email or password.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Log in to keep track of your money."
      badgeTitle="Cultivate Your Financial Future."
      badgeText="Real-time insights and bank-level security, built for Nigerian students and parents."
    >
      <ErrorBanner error={error} />
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-500">Password</label>
            <Link to="/reset-password" className="text-xs font-semibold text-brand-700">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
        </div>
        <LoadingButton loading={loading}>Log In</LoadingButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <Link to="/signup" className="font-semibold text-brand-700">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
