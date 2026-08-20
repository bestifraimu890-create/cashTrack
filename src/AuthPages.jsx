import React, { useEffect, useRef, useState } from "react";
import {
  PiggyBank, ShieldCheck, AlertTriangle, Check, GraduationCap, Users, CheckCircle2, Loader2,
} from "lucide-react";
import { supabase } from "./supabase/client.js";

function AuthShell({ title, subtitle, badgeTitle, badgeText, children }) {
  return (
    <div className="flex min-h-screen w-full bg-paper">
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 lg:block">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute bottom-[-4rem] right-[-4rem] h-96 w-96 rounded-full bg-brand-900/30" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-2 text-white">
            <img src="/cashtrack-logo.png" alt="CashTrack" className="h-14 w-auto" />
          </div>
          <div className="rounded-2xl bg-white/95 p-6 shadow-xl">
            <p className="font-display text-lg font-bold text-slate-900">{badgeTitle}</p>
            <p className="mt-2 text-sm text-slate-600">{badgeText}</p>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <ShieldCheck size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">Bank Level Security</p>
                <p className="text-xs text-slate-500">Your data stays encrypted and private.</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-brand-100">Built for Nigerian students &amp; parents.</p>
        </div>
      </div>
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
      <AlertTriangle size={15} /> {error}
    </div>
  );
}

function LoadingButton({ children, loading }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}

/* --------------------------------- login ---------------------------------- */

// Creates the user's profile (+ wallet for students) from signup metadata
// if it doesn't exist yet. Used after OTP verification.
async function ensureProfile(user) {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (existing) return null;

  const m = user.user_metadata || {};
  const role = m.role === "parent" ? "parent" : "student";
  const profile = {
    id: user.id,
    first_name: m.first_name || "New",
    last_name: m.last_name || "User",
    role,
    school: m.school || null,
    phone: m.phone || null,
  };
  const { error } = await supabase.from("profiles").insert(profile);
  if (error) return error;

  if (role === "student") {
    const { error: walletError } = await supabase.from("wallets").insert({ owner_id: user.id });
    if (walletError) return walletError;
  }
  return null;
}

function LoginPage({ onLogin, onGoToSignup, onGoToReset, error: appError }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(appError || "");
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Already has a session — go straight to the app, or finish setup if the
  // profile is missing (account created but email never verified, or the user
  // just clicked the magic link in the verification email).
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
        onLogin(user);
      } else {
        // Session but no profile — try to finish setup from the signup metadata.
        // This covers the "clicked the magic link" path (no code needed).
        const profileError = await ensureProfile(user);
        if (!active) return;
        if (!profileError) {
          onLogin(user);
        } else {
          setEmail(user.email || "");
          setUnverified(true);
          setError("Your email isn't verified yet. Enter the code we emailed you to finish setup.");
        }
      }
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setUnverified(false);
    setResendSent(false);
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
        // Account exists but was never OTP-verified — send a fresh code and ask for it
        const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.trim() });
        if (!otpError) setResendSent(true);
        setUnverified(true);
        setError("Your email isn't verified yet. Enter the code we just emailed you to finish setup.");
        return;
      }
      onLogin(data.user);
    } catch (err) {
      if (err.message?.toLowerCase().includes("email not confirmed")) {
        setUnverified(true);
        setError("Your email isn't verified yet. Enter the code we emailed you to finish setup.");
      } else if (err.message?.toLowerCase().includes("invalid login credentials")) {
        setError("Wrong email or password.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError("");
    setResendSent(false);
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: email.trim() });
      if (otpError) throw otpError;
      setResendSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError("");
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setVerifying(true);
    try {
      const { data: otpData, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      if (verifyError) throw verifyError;
      const user = otpData?.user;
      if (!user) throw new Error("Verification failed. Please try again.");

      // Finish setup: create profile + wallet from signup metadata
      const profileError = await ensureProfile(user);
      if (profileError) throw profileError;

      onLogin(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
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
      {resendSent && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          <CheckCircle2 size={15} /> A verification code is on its way to {email.trim()}. Check your inbox (and spam).
        </div>
      )}

      {unverified ? (
        <form onSubmit={verifyCode} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Verification Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-center text-lg tracking-[0.5em] outline-none focus:border-brand-500"
            />
          </div>
          <LoadingButton loading={verifying}>Verify &amp; Continue</LoadingButton>
          <button
            type="button"
            onClick={resendCode}
            disabled={loading || verifying}
            className="w-full rounded-lg border border-brand-200 bg-brand-50 py-2.5 text-sm font-semibold text-brand-700 disabled:opacity-60"
          >
            Resend verification code
          </button>
          <p className="text-center text-xs text-slate-500">
            Wrong account?{" "}
            <button type="button" onClick={() => { setUnverified(false); setError(""); setCode(""); }} className="font-semibold text-brand-700">
              Back to login
            </button>
          </p>
        </form>
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
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500">Password</label>
              <button type="button" onClick={onGoToReset} className="text-xs font-semibold text-brand-700">
                Forgot password?
              </button>
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
      )}
      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <button onClick={onGoToSignup} className="font-semibold text-brand-700">
          Sign up
        </button>
      </p>
    </AuthShell>
  );
}

/* -------------------------------- sign up --------------------------------- */

function SignUpPage({ onGoToLogin }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [school, setSchool] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const resendTimer = useRef(null);

  const steps = ["Account", "Profile", "Verify"];

  useEffect(() => () => clearInterval(resendTimer.current), []);

  const startResendCountdown = () => {
    setResendIn(60);
    resendTimer.current = setInterval(() => {
      setResendIn((s) => {
        if (s <= 1) {
          clearInterval(resendTimer.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      // 1. Create the auth user with their password (email confirmation is OFF in Supabase)
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
      if (!signUpData.user || !signUpData.user.identities?.length) {
        throw new Error(
          "Sign-up failed. Please turn OFF \"Confirm email\" in Supabase dashboard: Authentication → Providers → Email."
        );
      }

      // 2. Supabase's built-in OTP email (6-digit code, default template)
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
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
      if (otpError) throw otpError;

      setStep(3);
      startResendCountdown();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
    } else if (step === 2) {
      if (role === "student" && !school.trim()) {
        setError("Enter your school.");
        return;
      }
      if (role === "parent" && !phone.trim()) {
        setError("Enter your phone number.");
        return;
      }
      sendOtp(); // sends the OTP via Brevo, then advances to step 3
    }
  };

  const back = () => {
    setError("");
    setInfo("");
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code sent to your email.");
      return;
    }
    setLoading(true);
    try {
      // Verify the 6-digit code Supabase emailed — this also confirms the email
      const { data: otpData, error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      if (verifyError) throw verifyError;
      const uid = otpData?.user?.id;
      if (!uid) throw new Error("Verification failed. Please try again.");

      // Create the profile now that the email is verified (RLS allows own-row insert)
      const { error: profileError } = await supabase.from("profiles").insert({
        id: uid,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role,
        school: role === "student" ? school.trim() : null,
        phone: role === "parent" ? phone.trim() : null,
      });
      if (profileError) throw profileError;

      // Students get a wallet automatically
      if (role === "student") {
        const { error: walletError } = await supabase.from("wallets").insert({ owner_id: uid });
        if (walletError) throw walletError;
      }

      // Route to login — the login page detects the session and auto-redirects to the app
      onGoToLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = () => {
    if (resendIn > 0 || loading) return;
    sendOtp();
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
          const done = step > n;
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
              {n < steps.length && <div className={`h-0.5 flex-1 ${step > n ? "bg-brand-700" : "bg-slate-200"}`} />}
            </React.Fragment>
          );
        })}
      </div>

      <ErrorBanner error={error} />
      {info && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          <CheckCircle2 size={15} /> {info}
        </div>
      )}

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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
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
          <p className="text-xs text-slate-400">
            We'll email a 6-digit verification code to <span className="font-medium text-slate-600">{email.trim()}</span>.
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={back} className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600">
              Back
            </button>
            <button
              type="button"
              onClick={next}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Send Code
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-slate-500">
            We sent a 6-digit code to <span className="font-medium text-slate-700">{email.trim()}</span>. It expires in
            10 minutes.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-center text-lg tracking-[0.5em] outline-none focus:border-brand-500"
          />
          <div className="flex gap-3">
            <button type="button" onClick={back} className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600">
              Back
            </button>
            <LoadingButton loading={loading}>Verify &amp; Continue</LoadingButton>
          </div>
          <p className="text-center text-xs text-slate-500">
            Didn't get the code?{" "}
            {resendIn > 0 ? (
              <span className="text-slate-400">Resend in {resendIn}s</span>
            ) : (
              <button type="button" onClick={resend} className="font-semibold text-brand-700">
                Resend code
              </button>
            )}
          </p>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <button onClick={onGoToLogin} className="font-semibold text-brand-700">
          Log in
        </button>
      </p>
    </AuthShell>
  );
}

/* ----------------------------- reset password ------------------------------ */

function ResetPasswordPage({ onGoToLogin }) {
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
        <button onClick={onGoToLogin} className="font-semibold text-brand-700">
          Log in
        </button>
      </p>
    </AuthShell>
  );
}

export { LoginPage, SignUpPage, ResetPasswordPage };