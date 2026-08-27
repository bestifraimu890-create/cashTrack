import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabase/client.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { initialsOf } from "../../lib/constants.js";
import { Card } from "../../components/common/index.js";

export default function Profile() {
  const { user } = useOutletContext();
  const { refreshUser } = useAuth();
  const [connectionId, setConnectionId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [firstName, setFirstName] = useState(user?.user_metadata?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.user_metadata?.last_name ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.user_metadata?.first_name ?? "");
    setLastName(user.user_metadata?.last_name ?? "");
    supabase
      .from("profiles")
      .select("connection_id")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setConnectionId(data?.connection_id ?? null));
  }, [user?.id]);

  const generateId = async () => {
    setGenerating(true);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let id = "";
    for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
    const { error } = await supabase
      .from("profiles")
      .update({ connection_id: id })
      .eq("id", user.id);
    if (!error) setConnectionId(id);
    setGenerating(false);
  };

  const copyId = () => {
    if (!connectionId) return;
    navigator.clipboard.writeText(connectionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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

    setSaving(true);
    const updates = {};

    if (firstName.trim() !== (user?.user_metadata?.first_name ?? "") ||
        lastName.trim() !== (user?.user_metadata?.last_name ?? "")) {
      updates.data = { first_name: firstName.trim(), last_name: lastName.trim() };
    }

    if (newPassword) {
      updates.password = newPassword;
    }

    if (Object.keys(updates).length === 0) {
      setFeedback({ type: "error", msg: "No changes to save." });
      setSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser(updates);

    if (error) {
      setFeedback({ type: "error", msg: error.message });
    } else {
      if (updates.data) {
        await supabase
          .from("profiles")
          .update({ first_name: firstName.trim(), last_name: lastName.trim() })
          .eq("id", user.id);
      }
      setFeedback({ type: "success", msg: "Profile updated successfully." });
      setNewPassword("");
      setConfirmPassword("");
      await refreshUser();
    }
    setSaving(false);
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
            Student Account
          </span>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Connection ID</h4>
          <p className="mb-3 text-xs text-slate-500">
            Share this code with your parent so they can link your account.
          </p>
          {connectionId ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2.5 text-center font-mono text-lg font-bold tracking-widest text-slate-800">
                {connectionId}
              </div>
              <button
                onClick={copyId}
                className="rounded-lg border border-brand-200 px-3 py-2.5 text-xs font-semibold text-brand-700"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          ) : (
            <button
              onClick={generateId}
              disabled={generating}
              className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {generating ? "Generating…" : "Generate Connection ID"}
            </button>
          )}
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
            disabled={saving}
            className="rounded-lg bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </Card>
    </div>
  );
}
