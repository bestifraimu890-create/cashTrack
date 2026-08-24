import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabase/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { initialsOf } from "../../lib/constants.js";
import { Card } from "../../components/common/index.js";

export default function Profile() {
  const { user } = useOutletContext();
  const { refreshUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.user_metadata?.first_name ?? "");
    setLastName(user.user_metadata?.last_name ?? "");
  }, [user?.id]);

  const buildUpdates = () => {
    const updates = {};
    if (firstName.trim() !== (user?.user_metadata?.first_name ?? "") ||
        lastName.trim() !== (user?.user_metadata?.last_name ?? "")) {
      updates.data = { first_name: firstName.trim(), last_name: lastName.trim() };
    }
    if (newPassword) {
      updates.password = newPassword;
    }
    return updates;
  };

  const handleSave = async () => {
    setFeedback(null);

    if (newPassword && newPassword.length < 6) {
      setFeedback({ type: "error", msg: "Password must be at least 6 characters." });
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setFeedback({ type: "error", msg: "Passwords do not match." });
      return;
    }

    const updates = buildUpdates();
    if (Object.keys(updates).length === 0) {
      setFeedback({ type: "error", msg: "No changes to save." });
      return;
    }

    setPendingUpdates(updates);
    setOtpSending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: user.email });
      if (error) throw error;
      setShowOtp(true);
      setFeedback({ type: "success", msg: `Verification code sent to ${user.email}` });
    } catch (e) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setOtpSending(false);
    }
  };

  const verifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setFeedback({ type: "error", msg: "Enter the 6-digit code." });
      return;
    }
    setOtpVerifying(true);
    setFeedback(null);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: user.email,
        token: otp,
        type: "email",
      });
      if (verifyError) throw verifyError;

      const { error: updateError } = await supabase.auth.updateUser(pendingUpdates);
      if (updateError) throw updateError;

      setFeedback({ type: "success", msg: "Profile updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
      setShowOtp(false);
      setOtp("");
      setPendingUpdates(null);
      await refreshUser();
    } catch (e) {
      setFeedback({ type: "error", msg: e.message });
    } finally {
      setOtpVerifying(false);
    }
  };

  const cancelOtp = () => {
    setShowOtp(false);
    setOtp("");
    setPendingUpdates(null);
    setFeedback(null);
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-1">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-700 text-2xl font-bold text-white">
            {initialsOf(user)}
          </div>
          <p className="mt-3 font-semibold text-slate-900">{firstName} {lastName}</p>
          <p className="text-sm text-slate-400">{user?.email}</p>
          <span className="mt-3 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Parent Account
          </span>
        </div>
      </Card>

      <Card className="p-6 lg:col-span-2">
        <h3 className="mb-4 font-semibold text-slate-900">Personal Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">First Name</label>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Last Name</label>
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500">Email Address</label>
            <input
              defaultValue={user?.email ?? ""}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-400 outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">Email cannot be changed.</p>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="mb-4 font-semibold text-slate-900">Change Password</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {showOtp && (
          <div className="mt-6 rounded-lg border border-brand-200 bg-brand-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Verify your identity</p>
            <p className="mt-1 text-xs text-slate-500">
              Enter the 6-digit code sent to <span className="font-medium">{user?.email}</span>
            </p>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-32 rounded-lg border border-slate-200 px-3 py-2.5 text-center font-mono text-lg tracking-widest outline-none focus:border-brand-500"
              />
              <button
                onClick={verifyOtp}
                disabled={otpVerifying || otp.length !== 6}
                className="rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {otpVerifying ? "Verifying…" : "Verify"}
              </button>
              <button
                onClick={cancelOtp}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {feedback && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-sm ${
              feedback.type === "error"
                ? "bg-red-50 text-red-700"
                : "bg-mint-50 text-mint-700"
            }`}
          >
            {feedback.msg}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || otpSending}
            className="rounded-lg bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            {otpSending ? "Sending code…" : saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </Card>
    </div>
  );
}
