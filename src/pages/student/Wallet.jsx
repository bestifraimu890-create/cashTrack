import React, { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Lock, ShieldCheck, CheckCircle2, X, Link2, Send, Clock } from "lucide-react";
import { supabase } from "../../supabase/client.js";
import { naira } from "../../lib/constants.js";
import { Card, ProgressBar } from "../../components/common/index.js";

const STATUS_STYLE = {
  pending: "bg-amber-50 text-amber-600",
  approved: "bg-mint-50 text-mint-700",
  declined: "bg-red-50 text-red-600",
};

function StatusBadge({ status }) {
  const Icon = status === "approved" ? CheckCircle2 : status === "declined" ? X : Clock;
  return (
    <span className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${STATUS_STYLE[status] ?? STATUS_STYLE.pending}`}>
      <Icon size={12} />
      {status}
    </span>
  );
}

export default function Wallet() {
  const navigate = useNavigate();
  const { user, walletBalance, weeklySpent, weeklyLimit, monthlySpent, monthlyLimit, parentName, parentLinked, parentBalance } = useOutletContext();
  const [showFund, setShowFund] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundNote, setFundNote] = useState("");
  const [sending, setSending] = useState(false);
  const [fundStatus, setFundStatus] = useState(null);
  const [myRequests, setMyRequests] = useState([]);

  const loadMyRequests = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("fund_requests")
      .select("id, amount, note, status, created_at")
      .eq("student_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setMyRequests(data ?? []);
  };

  useEffect(() => {
    loadMyRequests();
  }, [user?.id]);

  const handleFundRequest = async () => {
    const value = parseFloat(fundAmount);
    if (!value || value <= 0) return;
    setSending(true);
    setFundStatus(null);
    const { data: link } = await supabase
      .from("households")
      .select("parent_id")
      .eq("child_id", user.id)
      .maybeSingle();
    if (!link?.parent_id) {
      setFundStatus({ type: "error", msg: "No parent linked." });
      setSending(false);
      return;
    }
    const { error } = await supabase.from("fund_requests").insert({
      student_id: user.id,
      parent_id: link.parent_id,
      amount: value,
      note: fundNote.trim() || null,
    });
    if (error) {
      setFundStatus({ type: "error", msg: error.message });
    } else {
      setFundStatus({ type: "success", msg: `Request for ${naira(value)} sent to ${parentName}.` });
      setFundAmount("");
      setFundNote("");
      loadMyRequests();
    }
    setSending(false);
  };

  if (!parentLinked) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <Link2 size={28} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">No parent linked yet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Link to a parent to see your available balance, request funds, and track spending limits.
          </p>
          <p className="mt-4 text-sm text-slate-600">
            Go to <span className="font-semibold">Profile</span> to generate a Connection ID, then share it with your parent.
          </p>
          <button
            onClick={() => navigate("/student/profile")}
            className="mt-6 rounded-lg bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Go to Profile
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-brand-800 to-brand-600 p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Available Balance</p>
        <p className="mt-2 text-3xl font-bold font-display tabular-nums">{naira(parentBalance)}</p>
        <p className="mt-1 text-xs text-brand-100">{parentName}'s wallet · available for you</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => setShowFund(!showFund)}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-800"
          >
            Request Funds
          </button>
        </div>
      </Card>

      {showFund && (
        <Card className="p-5">
          <h3 className="font-semibold text-slate-900">Request Funds from {parentName}</h3>
          <p className="mt-1 text-sm text-slate-500">Your parent will be notified and can approve or decline.</p>
          {fundStatus && (
            <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              fundStatus.type === "success" ? "bg-mint-50 text-mint-700" : "bg-red-50 text-red-600"
            }`}>
              {fundStatus.type === "success" ? <CheckCircle2 size={16} /> : <X size={16} />}
              {fundStatus.msg}
            </div>
          )}
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Amount (₦)</label>
              <input
                type="number"
                min="0"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Note (optional)</label>
              <input
                value={fundNote}
                onChange={(e) => setFundNote(e.target.value)}
                placeholder="e.g. For school supplies"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              onClick={handleFundRequest}
              disabled={sending || !fundAmount}
              className="flex items-center gap-2 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Send size={14} />
              {sending ? "Sending…" : "Send Request"}
            </button>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">My Requests</h3>
          <button onClick={loadMyRequests} className="text-xs font-semibold text-brand-700 hover:underline">
            Refresh
          </button>
        </div>
        {myRequests.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No fund requests yet. Your requests and your parent's decisions will show here.</p>
        ) : (
          <div className="mt-3 divide-y divide-slate-100">
            {myRequests.map((r) => (
              <div key={r.id} className="py-2.5">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 tabular-nums">{naira(r.amount)}</p>
                    <p className="truncate text-xs text-slate-400">
                      {r.note || "No note"} · {new Date(r.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
                {r.status === "approved" && (
                  <button
                    onClick={() => navigate("/student/withdraw")}
                    className="mt-1.5 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Approved — collect {naira(r.amount)} now →
                  </button>
                )}
                {r.status === "declined" && (
                  <p className="mt-1 text-xs text-slate-400">Not approved by {parentName}.</p>
                )}
                {r.status === "pending" && (
                  <p className="mt-1 text-xs text-slate-400">Waiting for {parentName} to approve.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Card className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Weekly Spending Limit</p>
            <Lock size={14} className="text-slate-300" />
          </div>
          <ProgressBar value={weeklySpent} max={weeklyLimit} danger={weeklySpent > weeklyLimit} />
          <p className="mt-2 text-xs text-slate-500">
            {naira(weeklySpent)} used of {naira(weeklyLimit)} · resets Monday
          </p>
        </Card>
        <Card className="p-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Monthly Spending Limit</p>
            <Lock size={14} className="text-slate-300" />
          </div>
          <ProgressBar value={monthlySpent} max={monthlyLimit} danger={monthlySpent > monthlyLimit} />
          <p className="mt-2 text-xs text-slate-500">
            {naira(monthlySpent)} used of {naira(monthlyLimit)} · resets Sept 1
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-brand-700" />
          <div>
            <p className="text-sm font-semibold text-slate-800">Limits set by your parent</p>
            <p className="mt-1 text-sm text-slate-500">
              {parentName} controls your daily, weekly and monthly spending limits. Ask them to adjust these
              from their Parental Controls dashboard if you need more room this month.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
