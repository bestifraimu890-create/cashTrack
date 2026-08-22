import React, { useMemo } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { Wallet as WalletIcon, Receipt, ChevronRight, Sparkles, PiggyBank } from "lucide-react";
import { naira, CATEGORIES } from "../../lib/constants.js";
import { Card, CategoryIcon, ProgressBar, EmptyState } from "../../components/common/index.js";

// Builds a running-balance line from the ledger (oldest first) so the
// dashboard chart reflects real activity.
function runningBalanceSeries(transactions) {
  const chronological = [...transactions].reverse();
  let running = 0;
  return chronological.map((t, i) => {
    running += t.amount;
    return { label: `#${i + 1}`, balance: running };
  });
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const {
    studentName, transactions, budgets, walletBalance, weeklySpent, weeklyLimit, parentName,
  } = useOutletContext();

  const recent = transactions.slice(0, 4);
  const overBudget = budgets.find((b) => b.spent > b.budgeted);
  const pctUsed = weeklyLimit ? Math.min(100, Math.round((weeklySpent / weeklyLimit) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Welcome back, {studentName}.</h2>
        <p className="mt-1 text-sm text-slate-500">Here's where things stand right now.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Wallet Balance</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-3xl font-bold font-display tabular-nums text-slate-900">{naira(walletBalance)}</span>
          </div>
          {transactions.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={WalletIcon}
                title="No activity yet"
                body="Your balance trend will show up here once money starts moving through your wallet."
                actionLabel="Add your first expense"
                onAction={() => navigate("/student/add-expense")}
              />
            </div>
          ) : (
            <div className="mt-6 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={runningBalanceSeries(transactions)} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="bal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5B3FA8" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#5B3FA8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip
                    formatter={(v) => naira(v)}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#5B3FA8" strokeWidth={2.5} fill="url(#bal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-4 bg-brand-800 p-6 text-white">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-gold-300" />
            <p className="font-semibold">Weekly Limit</p>
          </div>
          {overBudget ? (
            <div className="rounded-xl bg-brand-700/60 p-4">
              <p className="text-sm font-semibold">{overBudget.category} is over budget</p>
              <p className="mt-1 text-xs leading-relaxed text-brand-100">
                You've spent {naira(overBudget.spent)} of your {naira(overBudget.budgeted)} {overBudget.category} budget.
                Trim spending here to stay on track.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-brand-700/60 p-4">
              <p className="text-sm font-semibold">You're on track</p>
              <p className="mt-1 text-xs leading-relaxed text-brand-100">
                No budgets are over their limit this month. Nice work.
              </p>
            </div>
          )}
          <div>
            <div className="mb-1 flex items-center justify-between text-xs text-brand-100">
              <span>WEEKLY LIMIT</span>
              <span>{pctUsed}% used</span>
            </div>
            <div className="h-2 w-full rounded-full bg-brand-900/50">
              <div className="h-2 rounded-full bg-white" style={{ width: `${pctUsed}%` }} />
            </div>
            <p className="mt-1 text-xs text-brand-100">
              {naira(weeklySpent)} of {naira(weeklyLimit)} · set by {parentName}
            </p>
          </div>
          <button
            onClick={() => navigate("/student/insights")}
            className="mt-auto flex items-center justify-center gap-1 rounded-lg bg-white py-2 text-sm font-semibold text-brand-800"
          >
            View Insights <ChevronRight size={15} />
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Category Budgets</h3>
            <button onClick={() => navigate("/student/budget")} className="text-xs font-semibold text-brand-700">
              Manage
            </button>
          </div>
          {budgets.length === 0 ? (
            <EmptyState
              icon={PiggyBank}
              title="No budgets set yet"
              body="Set a limit for a category and CashTrack will track it here automatically."
              actionLabel="Set up a budget"
              onAction={() => navigate("/student/budget")}
            />
          ) : (
            <div className="space-y-4">
              {budgets.map((b) => {
                const over = b.spent > b.budgeted;
                return (
                  <div key={b.category}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-700">
                        <CategoryIcon category={b.category} size={14} />
                        {b.category}
                      </span>
                      <span className={over ? "font-semibold text-red-600" : "text-slate-500"}>
                        {naira(b.spent)} / {naira(b.budgeted)}
                      </span>
                    </div>
                    <ProgressBar value={b.spent} max={b.budgeted || 1} danger={over} />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Recent Transactions</h3>
            <button onClick={() => navigate("/student/transactions")} className="text-xs font-semibold text-brand-700">
              View All
            </button>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              body="Log an expense manually or import a CSV and it'll show up here."
              actionLabel="Add an expense"
              onAction={() => navigate("/student/add-expense")}
            />
          ) : (
            <div className="space-y-4">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <CategoryIcon category={t.category} size={16} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{t.merchant}</p>
                    <p className="text-xs text-slate-400">
                      {t.category} · {new Date(t.created_at).toLocaleDateString("en-NG")}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold tabular-nums ${t.amount > 0 ? "text-mint-600" : "text-slate-800"}`}>
                    {t.amount > 0 ? "+" : "-"}
                    {naira(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
