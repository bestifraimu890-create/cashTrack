import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Lock, ShieldCheck, CheckCircle2, X, Link2 } from "lucide-react";
import { naira } from "../../lib/constants.js";
import { Card, ProgressBar } from "../../components/common/index.js";

export default function Wallet() {
  const navigate = useNavigate();
  const { walletBalance, weeklySpent, weeklyLimit, monthlySpent, monthlyLimit, parentName, parentLinked, parentBalance } = useOutletContext();
  const [showFund, setShowFund] = useState(false);

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
            onClick={() => setShowFund(true)}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-800"
          >
            Request Funds
          </button>
        </div>
      </Card>

      {showFund && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
          <CheckCircle2 size={18} />
          Fund request sent to {parentName}. You'll get a notification once it's approved.
          <button onClick={() => setShowFund(false)} className="ml-auto text-mint-600">
            <X size={16} />
          </button>
        </div>
      )}

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
