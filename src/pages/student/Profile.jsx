import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabase/client.js";
import { initialsOf } from "../../lib/constants.js";
import { Card } from "../../components/common/index.js";

export default function Profile() {
  const { user } = useOutletContext();
  const [connectionId, setConnectionId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
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

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-1">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-700 text-2xl font-bold text-white">
            {initialsOf(user)}
          </div>
          <p className="mt-3 font-semibold text-slate-900">{user?.user_metadata?.first_name} {user?.user_metadata?.last_name}</p>
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
            <label className="mb-1 block text-xs font-semibold text-slate-500">Full Name</label>
            <input defaultValue={`${user?.user_metadata?.first_name ?? ""} ${user?.user_metadata?.last_name ?? ""}`} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Email Address</label>
            <input defaultValue={user?.email ?? ""} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>
      </Card>
    </div>
  );
}
