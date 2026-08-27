import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Lock, ShieldCheck, CheckCircle2, X } from "lucide-react";
import { naira } from "../../lib/constants.js";
import { Card, ProgressBar } from "../../components/common/index.js";

export default function Wallet() {
  const { walletBalance, weeklySpent, weeklyLimit, monthlySpent, monthlyLimit, parentName, parentBalance } = useOutletContext();
  const [showFund, setShowFund] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-brand-800 to-brand-600 p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Available Balance</p>
        <p className="mt-2 text-3xl font-bold font-display tabular-nums">{naira(walletBalance)}</p>
        <p className="mt-1 text-xs text-brand-100">Your wallet · linked to {parentName}</p>
        <div className="mt-4 rounded-xl border border-white/20 bg-white/10 p-3">
          <p className="text-xs text-brand-100">{parentName}'s wallet balance</p>
          <p className="mt-1 text-xl font-bold font-display tabular-nums">{naira(parentBalance)}</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => setShowFund(true)}
            className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-brand-800"
          >
            Request Funds
          </button>
          <button className="rounded-lg border border-white/40 px-4 py-2 text-sm font-semibold text-white">
            Send to Savings Goal
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
