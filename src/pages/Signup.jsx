import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, GraduationCap, Users, Eye, EyeOff, Mail } from "lucide-react";
import { supabase } from "../supabase/client.js";
import { ensureProfile } from "../lib/auth.js";
import { AuthShell } from "../components/layout/AuthShell.jsx";
import { ErrorBanner, LoadingButton } from "../components/common/index.js";

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("student");
  const [school, setSchool] = useState("");
  const [phone, setPhone] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const steps = ["Account", "Profile", "Verify"];

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
      supabase.auth.getSession().then(({ data, error }) => {
        if (!error && data.session) {
          setEmailVerified(true);
          setStep(3);
          window.location.hash = "";
        }
      });
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setEmailVerified(true);
      setStep(3);
    };
    window.addEventListener("signup-verified", handler);
    return () => window.removeEventListener("signup-verified", handler);
  }, []);

  const next = () => {
    setError("");
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim() || !email.trim()) {
        setError("Fill in every field.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError("Enter a valid email address.");
        return;
      }
      if (password.length < 8) {
        setError("Password needs at least 8 characters.");
        return;
      }
      setStep(2);
    }
  };

  const sendMagicLink = async () => {
    if (role === "student" && !school.trim()) {
      setError("Enter your school.");
      return;
    }
    if (role === "parent" && !phone.trim()) {
      setError("Enter your phone number.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const redirectUrl = `${window.location.origin}/auth/callback?type=signup`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            role,
            school: role === "student" ? school.trim() : null,
            phone: role === "parent" ? phone.trim() : null,
          },
        },
      });
      if (otpError) throw otpError;
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!emailVerified) {
      setError("Please verify your email first.");
      return;
    }
    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            role,
            school: role === "student" ? school.trim() : null,
            phone: role === "parent" ? phone.trim() : null,
          },
        },
      });
      if (signUpError) throw signUpError;
      if (!signUpData.user) {
        throw new Error("Sign-up failed. Please try again.");
      }

      await ensureProfile(signUpData.user);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your journey to financial clarity today."
      badgeTitle="Join thousands of Nigerian students."
      badgeText="Track spending, hit savings goals, and stay within limits your parents set."
    >
      <div className="mb-6 flex items-center gap-2">
        {steps.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = step > n || (n === 3 && emailVerified) || (n === 1 && step > 1) || (n === 2 && step > 2);
          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                    done ? "bg-brand-700 text-white" : active ? "border-2 border-brand-700 text-brand-700" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {done ? <Check size={13} /> : n}
                </div>
                <span className={`text-[11px] ${active || done ? "text-slate-700" : "text-slate-400"}`}>{label}</span>
              </div>
              {n < steps.length && <div className={`h-0.5 flex-1 ${done ? "bg-brand-700" : "bg-slate-200"}`} />}
            </React.Fragment>
          );
        })}
      </div>

      <ErrorBanner error={error} />

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">First Name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Last Name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>
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
            <label className="mb-1 block text-xs font-semibold text-slate-500">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="button" onClick={next} className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white">
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-semibold text-slate-500">I am signing up as a...</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "student", label: "Student", icon: GraduationCap },
                { key: "parent", label: "Parent", icon: Users },
              ].map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 ${
                    role === r.key ? "border-brand-600 bg-brand-50" : "border-slate-200"
                  }`}
                >
                  <r.icon size={20} className={role === r.key ? "text-brand-700" : "text-slate-400"} />
                  <span className={`text-sm font-semibold ${role === r.key ? "text-brand-700" : "text-slate-600"}`}>
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
          {role === "student" ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">School</label>
              <input
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. Greenwood College, Lagos"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 812 345 6789"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600">
              Back
            </button>
            <button type="button" onClick={sendMagicLink} disabled={loading} className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {loading ? "Sending link…" : "Send Verification Link"}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex flex-col items-center rounded-lg bg-brand-50 p-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <Mail size={24} className="text-brand-700" />
            </div>
            <p className="text-sm font-semibold text-brand-800">Check your email</p>
            <p className="mt-1 text-sm text-brand-600">
              We sent a verification link to<br />
              <span className="font-semibold">{email}</span>
            </p>
            <p className="mt-3 text-xs text-brand-500">
              Click the link in the email to verify your account, then come back here to finish.
            </p>
          </div>
          {emailVerified ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-mint-50 p-3 text-sm text-mint-700">
                <Check size={16} /> Email verified successfully
              </div>
              <LoadingButton loading={loading}>Create Account</LoadingButton>
            </form>
          ) : (
            <button
              type="button"
              onClick={sendMagicLink}
              disabled={loading}
              className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Resend verification link"}
            </button>
          )}
        </div>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-700">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
