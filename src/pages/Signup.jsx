import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, GraduationCap, Users, Eye, EyeOff, Mail } from "lucide-react";
import { supabase } from "../supabase/client.js";
import { ensureProfile } from "../lib/auth.js";
import { AuthShell } from "../components/layout/AuthShell.jsx";
import { ErrorBanner } from "../components/common/index.js";

const PENDING_KEY = "cashtrack_pending_signup";
const VERIFIED_KEY = "cashtrack_signup_verified";

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

  // Restore pending signup (survives the magic-link redirect) and watch for
  // verification completed in another tab.
  useEffect(() => {
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
      if (pending) {
        if (pending.firstName) setFirstName(pending.firstName);
        if (pending.lastName) setLastName(pending.lastName);
        if (pending.email) setEmail(pending.email);
        if (pending.role) setRole(pending.role);
        if (pending.school) setSchool(pending.school);
        if (pending.phone) setPhone(pending.phone);
        const verifiedEmail = localStorage.getItem(VERIFIED_KEY) || "";
        if (
          verifiedEmail &&
          pending.email &&
          verifiedEmail.toLowerCase() === pending.email.toLowerCase()
        ) {
          setEmailVerified(true);
          setStep(3);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    const onStorage = (e) => {
      if (e.key === VERIFIED_KEY && e.newValue) {
        setEmailVerified(true);
        setStep(3);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
      const trimmedEmail = email.trim();
      const metadata = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role,
        school: role === "student" ? school.trim() : null,
        phone: role === "parent" ? phone.trim() : null,
      };

      // Persist everything except the password so a page reload (or the
      // redirect back from the magic link) doesn't lose the form.
      try {
        localStorage.setItem(
          PENDING_KEY,
          JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: trimmedEmail,
            role,
            school: school.trim(),
            phone: phone.trim(),
          })
        );
      } catch {
        /* ignore storage errors */
      }

      // 1) Create the account FIRST (with password + role metadata) so the
      //    role is stored before the magic link is ever clicked.
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { data: metadata },
      });
      if (signUpError) {
        const msg = signUpError.message || "";
        // Resend case: account already exists — just send a fresh link.
        if (!/already registered|already exists|already been registered/i.test(msg)) {
          throw signUpError;
        }
      }

      // 2) Make sure the profile (with the chosen role) exists now.
      let accountUser = signUpData?.user ?? null;
      if (!accountUser) {
        const { data } = await supabase.auth.getUser();
        accountUser = data.user ?? null;
      }
      if (accountUser) {
        try {
          await ensureProfile(accountUser);
        } catch {
          /* AuthCallback retries this after the link is clicked */
        }
      }

      // 3) Send the magic-link verification email.
      const redirectUrl = `${window.location.origin}/auth/callback?type=signup`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: { emailRedirectTo: redirectUrl },
      });
      if (otpError) throw otpError;

      // 4) Sign out until the link is clicked — the account stays unverified.
      await supabase.auth.signOut();
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {
      /* ignore */
    }
    navigate("/login", { replace: true });
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
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-mint-50 p-3 text-sm text-mint-700">
                <Check size={16} /> Email verified successfully
              </div>
              <button
                type="button"
                onClick={goToLogin}
                className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white"
              >
                Continue to Log In
              </button>
            </div>
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
