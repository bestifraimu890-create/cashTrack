import React, { useState } from "react";
import {
  PiggyBank, ShieldCheck, AlertTriangle, Check, GraduationCap, Users, CheckCircle2,
} from "lucide-react";

/* ============================================================
   AUTH — login, sign up, and reset password
   No real backend: any non-empty submission "succeeds". These
   pages exist to demo the flow and hand off a role to the app.
   ============================================================ */

function AuthShell({ title, subtitle, badgeTitle, badgeText, children }) {
  return (
    <div className="flex min-h-screen w-full bg-paper">
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-800 via-brand-700 to-brand-600 lg:block">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute bottom-[-4rem] right-[-4rem] h-96 w-96 rounded-full bg-brand-900/30" />
        <div className="relative z-10 flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-2 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <PiggyBank size={18} />
            </div>
            <span className="text-lg font-bold font-display">CashTrack</span>
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

function LoginPage({ onLogin, onGoToSignup, onGoToReset }) {
  const [role, setRole] = useState("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const roles = [
    { key: "student", label: "Student" },
    { key: "parent", label: "Parent" },
    { key: "admin", label: "Super Admin" },
  ];

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    onLogin(role);
  };

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Log in to keep track of your money."
      badgeTitle="Cultivate Your Financial Future."
      badgeText="Real-time insights and bank-level security, built for Nigerian students and parents."
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertTriangle size={15} /> {error}
        </div>
      )}
      <div className="mb-5">
        <label className="mb-2 block text-xs font-semibold text-slate-500">Continue as</label>
        <div className="grid grid-cols-3 gap-2">
          {roles.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRole(r.key)}
              className={`rounded-lg border px-2 py-2 text-xs font-semibold ${
                role === r.key ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
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
        <button type="submit" className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white">
          Log In
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Don't have an account?{" "}
        <button onClick={onGoToSignup} className="font-semibold text-brand-700">
          Sign up
        </button>
      </p>
    </AuthShell>
  );
}

function SignUpPage({ onSignup, onGoToLogin }) {
  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const steps = ["Account", "Profile", "Verify"];

  const next = () => {
    setError("");
    if (step === 1 && (!firstName.trim() || !lastName.trim() || !email.trim() || password.length < 8)) {
      setError("Fill in every field — password needs at least 8 characters.");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const back = () => {
    setError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = (e) => {
    e.preventDefault();
    if (code.trim().length < 4) {
      setError("Enter the verification code sent to your email.");
      return;
    }
    onSignup(role);
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

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          <AlertTriangle size={15} /> {error}
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
                placeholder="e.g. Greenwood College, Lagos"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Phone Number</label>
              <input
                placeholder="+234 812 345 6789"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={back} className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600">
              Back
            </button>
            <button type="button" onClick={next} className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white">
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-slate-500">
            We sent a 6-digit code to <span className="font-medium text-slate-700">{email || "your email"}</span>.
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter code"
            maxLength={6}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-center text-lg tracking-[0.5em] outline-none focus:border-brand-500"
          />
          <div className="flex gap-3">
            <button type="button" onClick={back} className="w-full rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-600">
              Back
            </button>
            <button type="submit" className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white">
              Verify &amp; Continue
            </button>
          </div>
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

function ResetPasswordPage({ onGoToLogin }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email address associated with your account and we'll send you a link to reset your password."
      badgeTitle="Security First."
      badgeText="Your peace of mind is our priority — industry-leading protocols keep your data safe."
    >
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
          <button type="submit" className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white">
            Send Reset Link
          </button>
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
