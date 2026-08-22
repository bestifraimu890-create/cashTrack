import React, { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "../supabase/client.js";
import { AuthShell } from "../components/layout/AuthShell.jsx";
import { ErrorBanner, LoadingButton } from "../components/common/index.js";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email address associated with your account and we'll send you a link to reset your password."
      badgeTitle="Security First."
      badgeText="Your peace of mind is our priority — industry-leading protocols keep your data safe."
    >
      <ErrorBanner error={error} />
      {sent ? (
        <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-3 text-sm text-brand-700">
          <CheckCircle2 size={16} /> If an account exists for {email}, a reset link is on its way.
        </div>
      ) : (
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
          <LoadingButton loading={loading}>Send Reset Link</LoadingButton>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        Remember your password?{" "}
        <Link to="/login" className="font-semibold text-brand-700">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
