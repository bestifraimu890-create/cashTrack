import React, { useState, useMemo, useRef } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  LayoutGrid, Wallet as WalletIcon, Receipt, PlusCircle, PiggyBank,
  LineChart as LineChartIcon, Bell, User, LogOut, Search,
  HelpCircle, Upload, CheckCircle2, AlertTriangle,
  X, ChevronRight, Sparkles, Lock, Menu, ShieldCheck, Users,
  PieChart as PieChartIcon,
} from "lucide-react";
import { CATEGORIES, naira, Card, CategoryIcon, ProgressBar, initialsOf } from "./shared.jsx";

/* ---------------------------------- data --------------------------------- */

const STUDENT = {
  name: "",
  school: "",
  parent: "",
};

// Fresh accounts start with no history — every list below fills in as the
// student logs real activity. See the *EmptyState components for what
// renders in the meantime.
const INITIAL_TX = [];
const INITIAL_BUDGET_LIMITS = {};
const NOTIFICATIONS = [];

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "wallet", label: "Wallet", icon: WalletIcon },
  { key: "transactions", label: "Transactions", icon: Receipt },
  { key: "add-expense", label: "Add Expense", icon: PlusCircle },
  { key: "budget", label: "Budget", icon: PiggyBank },
  { key: "insights", label: "Insights", icon: LineChartIcon },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "profile", label: "Profile", icon: User },
];

/* -------------------------------- helpers -------------------------------- */

const pageTitle = (key) => NAV.find((n) => n.key === key)?.label ?? "Dashboard";

// Builds a running-balance line from the ledger (oldest first) so the
// dashboard chart reflects real activity instead of a canned trend line.
function runningBalanceSeries(transactions) {
  const chronological = [...transactions].reverse();
  let running = 0;
  return chronological.map((t, i) => {
    running += t.amount;
    return { label: `#${i + 1}`, balance: running };
  });
}

/* -------------------------------- sidebar --------------------------------- */

function Sidebar({ active, onNavigate, mobileOpen, setMobileOpen, onSwitchRole, onLogout }) {
  const content = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <img src="/cashtrack-logo.png" alt="CashTrack" className="h-10 w-auto" />
        <p className="text-[11px] font-medium text-slate-400 leading-tight">Student</p>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => {
                onNavigate(key);
                setMobileOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <Icon size={18} className={isActive ? "text-brand-700" : "text-slate-400"} />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-slate-100 px-3 py-3">
        <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50">
          <HelpCircle size={18} className="text-slate-400" />
          Support
        </button>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50"
        >
          <LogOut size={18} className="text-slate-400" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200">
        {content}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 shadow-xl">{content}</div>
        </div>
      )}
    </>
  );
}

/* --------------------------------- topbar ---------------------------------- */

function Topbar({ title, onMenu, user }) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-paper/80 px-4 py-4 backdrop-blur lg:px-8">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
        <Menu size={20} />
      </button>
      <h1 className="text-lg font-bold font-display text-slate-900 lg:hidden">{title}</h1>
      <div className="ml-auto hidden flex-1 max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 lg:flex">
        <Search size={16} className="text-slate-400" />
        <input
          placeholder="Search transactions, insights..."
          className="w-full bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
        />
      </div>
      <button className="ml-auto relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
        <Bell size={19} />
      </button>
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white"
        title={(user?.user_metadata?.first_name || "") + " " + (user?.user_metadata?.last_name || "")}
      >
        {initialsOf(user)}
      </div>
    </div>
  );
}

/* -------------------------------- dashboard -------------------------------- */

function EmptyState({ icon: Icon, title, body, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon size={20} />
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="max-w-xs text-sm text-slate-500">{body}</p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-2 rounded-lg bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function DashboardPage({ transactions, budgets, walletBalance, weeklySpent, weeklyLimit, onNavigate }) {
  const recent = transactions.slice(0, 4);
  const overBudget = budgets.find((b) => b.spent > b.budgeted);
  const pctUsed = weeklyLimit ? Math.min(100, Math.round((weeklySpent / weeklyLimit) * 100)) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Welcome back, {STUDENT.name.split(" ")[0]}.</h2>
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
                onAction={() => onNavigate("add-expense")}
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
              {naira(weeklySpent)} of {naira(weeklyLimit)} · set by {STUDENT.parent}
            </p>
          </div>
          <button
            onClick={() => onNavigate("insights")}
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
            <button onClick={() => onNavigate("budget")} className="text-xs font-semibold text-brand-700">
              Manage
            </button>
          </div>
          {budgets.length === 0 ? (
            <EmptyState
              icon={PiggyBank}
              title="No budgets set yet"
              body="Set a limit for a category and CashTrack will track it here automatically."
              actionLabel="Set up a budget"
              onAction={() => onNavigate("budget")}
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
            <button onClick={() => onNavigate("transactions")} className="text-xs font-semibold text-brand-700">
              View All
            </button>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No transactions yet"
              body="Log an expense manually or import a CSV and it'll show up here."
              actionLabel="Add an expense"
              onAction={() => onNavigate("add-expense")}
            />
          ) : (
            <div className="space-y-4">
              {recent.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <CategoryIcon category={t.category} size={16} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{t.merchant}</p>
                    <p className="text-xs text-slate-400">
                      {t.category} · {t.date}, {t.time}
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


/* ---------------------------------- wallet ---------------------------------- */

function WalletPage({ walletBalance, weeklySpent, weeklyLimit, monthlySpent, monthlyLimit }) {
  const [showFund, setShowFund] = useState(false);
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-brand-800 to-brand-600 p-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-100">Available Balance</p>
        <p className="mt-2 text-3xl font-bold font-display tabular-nums">{naira(walletBalance)}</p>
        <p className="mt-1 text-xs text-brand-100">Linked to {STUDENT.parent}'s CashTrack account</p>
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
          Fund request sent to {STUDENT.parent}. You'll get a notification once it's approved.
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
              {STUDENT.parent} controls your daily, weekly and monthly spending limits. Ask them to adjust these
              from their Parental Controls dashboard if you need more room this month.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------- transactions ------------------------------- */

function TransactionsPage({ transactions }) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const filters = ["All", ...Object.keys(CATEGORIES), "Income"];

  const filtered = transactions.filter((t) => {
    const matchesFilter = filter === "All" || t.category === filter;
    const matchesQuery = t.merchant.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:w-72">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search merchant..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                filter === f ? "bg-brand-700 text-white" : "bg-white text-slate-500 border border-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            {transactions.length === 0
              ? "You haven't logged any transactions yet. Add an expense to get started."
              : "No transactions match your filters."}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                <CategoryIcon category={t.category} size={17} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{t.merchant}</p>
                  <p className="text-xs text-slate-400">
                    {t.category} · {t.date}, {t.time}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${t.amount > 0 ? "text-mint-600" : "text-slate-800"}`}>
                  {t.amount > 0 ? "+" : "-"}
                  {naira(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* -------------------------------- add expense -------------------------------- */

function AddExpensePage({ onAddExpense, onAddMany }) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [banner, setBanner] = useState(null);
  const fileRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!merchant.trim() || !value || value <= 0) {
      setBanner({ type: "error", text: "Enter a merchant name and a valid amount." });
      return;
    }
    onAddExpense({ merchant: merchant.trim(), category, amount: -Math.abs(value), note });
    setBanner({ type: "success", text: `Expense of ${naira(value)} added to ${category}.` });
    setAmount("");
    setMerchant("");
    setNote("");
  };

  const handleCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter(Boolean);
      const rows = lines[0]?.toLowerCase().includes("merchant") ? lines.slice(1) : lines;
      const parsed = rows
        .map((line) => {
          const [date, merchantName, cat, amt] = line.split(",").map((s) => s?.trim());
          const value = parseFloat(amt);
          if (!merchantName || !value) return null;
          return {
            merchant: merchantName,
            category: CATEGORIES[cat] ? cat : "Other",
            amount: -Math.abs(value),
            date: date || "Imported",
            time: "",
          };
        })
        .filter(Boolean);
      if (parsed.length) {
        onAddMany(parsed);
        setBanner({ type: "success", text: `Imported ${parsed.length} expense(s) from CSV.` });
      } else {
        setBanner({ type: "error", text: "Couldn't read that file. Use columns: date,merchant,category,amount." });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <h3 className="font-semibold text-slate-900">Log a new expense</h3>
        <p className="mt-1 text-sm text-slate-500">Manual entries appear in your transactions right away.</p>

        {banner && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              banner.type === "success" ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"
            }`}
          >
            {banner.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {banner.text}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Merchant / Description</label>
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. School Tuck Shop"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Amount (₦)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                {Object.keys(CATEGORIES).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <button type="submit" className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white">
            Add Expense
          </button>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-slate-900">Import from CSV</h3>
        <p className="mt-1 text-sm text-slate-500">
          Columns: <span className="font-mono text-xs">date, merchant, category, amount</span>
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-slate-400 hover:border-brand-400 hover:text-brand-600"
        >
          <Upload size={22} />
          <span className="text-sm font-medium">Click to upload .csv</span>
        </button>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleCsv} className="hidden" />
      </Card>
    </div>
  );
}

/* ---------------------------------- budget ---------------------------------- */

function BudgetPage({ budgets, onSetLimit }) {
  const [adding, setAdding] = useState(false);
  const [newCategory, setNewCategory] = useState(Object.keys(CATEGORIES)[0]);
  const [newAmount, setNewAmount] = useState("");

  const totalBudgeted = budgets.reduce((s, b) => s + b.budgeted, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const availableCategories = Object.keys(CATEGORIES).filter((c) => !budgets.some((b) => b.category === c));

  const submitNewBudget = (e) => {
    e.preventDefault();
    const value = parseFloat(newAmount);
    if (!value || value <= 0) return;
    onSetLimit(newCategory, value);
    setNewAmount("");
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Total Budgeted</p>
          <p className="mt-2 text-2xl font-bold font-display tabular-nums text-slate-900">{naira(totalBudgeted)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Total Spent</p>
          <p className="mt-2 text-2xl font-bold font-display tabular-nums text-slate-900">{naira(totalSpent)}</p>
        </Card>
        <Card className="bg-brand-700 p-5 text-white">
          <p className="text-xs font-semibold uppercase text-brand-100">Remaining</p>
          <p className="mt-2 text-2xl font-bold font-display tabular-nums">{naira(Math.max(0, totalBudgeted - totalSpent))}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Categories</h3>
          {availableCategories.length > 0 && (
            <button
              onClick={() => setAdding((a) => !a)}
              className="flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
            >
              <PlusCircle size={14} /> {adding ? "Cancel" : "Add Category"}
            </button>
          )}
        </div>

        {adding && (
          <form onSubmit={submitNewBudget} className="mb-5 flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-500">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
              >
                {availableCategories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-slate-500">Monthly limit (₦)</label>
              <input
                type="number"
                min="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="e.g. 3000"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button type="submit" className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">
              Save
            </button>
          </form>
        )}

        {budgets.length === 0 ? (
          <EmptyState
            icon={PiggyBank}
            title="No budgets yet"
            body="Add a category limit above to start tracking spend against it."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {budgets.map((b) => {
              const over = b.spent > b.budgeted;
              return (
                <div key={b.category} className="rounded-xl border border-slate-100 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <CategoryIcon category={b.category} size={15} />
                    <span className="text-sm font-semibold text-slate-800">{b.category}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className={`text-lg font-bold tabular-nums ${over ? "text-red-600" : "text-slate-900"}`}>
                      {naira(b.spent)}
                    </span>
                    <span className="text-xs text-slate-400">of {naira(b.budgeted)}</span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={b.spent} max={b.budgeted || 1} danger={over} />
                  </div>
                  {over && (
                    <p className="mt-1 text-xs font-medium text-red-500">
                      Over by {naira(b.spent - b.budgeted)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {budgets.length > 0 && (
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-slate-900">Budget vs Actual</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgets} margin={{ left: -20, right: 10 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip formatter={(v) => naira(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="budgeted" name="Budgeted" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                <Bar dataKey="spent" name="Spent" fill="#5B3FA8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

/* --------------------------------- insights --------------------------------- */

function InsightsPage({ budgets, transactions }) {
  const pieData = budgets.map((b) => ({ name: b.category, value: b.spent })).filter((d) => d.value > 0);
  const overBudget = budgets.filter((b) => b.spent > b.budgeted);
  const trend = runningBalanceSeries(transactions);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-slate-900">Spending by Category</h3>
          {pieData.length === 0 ? (
            <EmptyState
              icon={PieChartIcon}
              title="Nothing to show yet"
              body="Once you log a few expenses, your spending breakdown will appear here."
            />
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {pieData.map((d) => (
                        <Cell key={d.name} fill={CATEGORIES[d.name]?.color ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => naira(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORIES[d.name]?.color }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-slate-900">Balance Trend</h3>
          {trend.length < 2 ? (
            <EmptyState
              icon={LineChartIcon}
              title="Not enough activity yet"
              body="Your balance trend fills in as more transactions come through."
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="ins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#B07A1E" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#B07A1E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip formatter={(v) => naira(v)} />
                  <Area type="monotone" dataKey="balance" stroke="#B07A1E" strokeWidth={2.5} fill="url(#ins)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {overBudget.length > 0 && (
        <Card className="flex items-start gap-4 border-dashed p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-600">
            <Sparkles size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-800">
              {overBudget.length === 1 ? `${overBudget[0].category} is over budget` : `${overBudget.length} categories are over budget`}
            </p>
            <p className="text-sm text-slate-500">
              Trim spending on {overBudget.map((b) => b.category).join(" and ")} for the rest of the month to get back on track.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------- notifications ------------------------------- */

function NotificationsPage() {
  const iconFor = (type) =>
    type === "alert" ? (
      <AlertTriangle size={16} className="text-red-500" />
    ) : type === "success" ? (
      <CheckCircle2 size={16} className="text-mint-600" />
    ) : (
      <Bell size={16} className="text-blue-500" />
    );

  return (
    <Card>
      {NOTIFICATIONS.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            body="Budget alerts, fund requests and account updates will show up here."
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {NOTIFICATIONS.map((n) => (
            <div key={n.id} className="flex gap-3 px-5 py-4">
              <div className="mt-0.5">{iconFor(n.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-slate-400">{n.time}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ---------------------------------- profile ---------------------------------- */

function ProfilePage() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-1">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-700 text-2xl font-bold text-white">
            CO
          </div>
          <p className="mt-3 font-semibold text-slate-900">{STUDENT.name}</p>
          <p className="text-sm text-slate-400">{STUDENT.school}</p>
          <span className="mt-3 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Student Account
          </span>
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
          <Users size={18} className="text-slate-400" />
          <div>
            <p className="text-xs text-slate-400">Connected Parent</p>
            <p className="text-sm font-medium text-slate-700">{STUDENT.parent}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 lg:col-span-2">
        <h3 className="mb-4 font-semibold text-slate-900">Personal Information</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Full Name</label>
            <input defaultValue={STUDENT.name} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">School</label>
            <input defaultValue={STUDENT.school} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Email Address</label>
            <input defaultValue="" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Phone Number</label>
            <input defaultValue="" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500" />
          </div>
        </div>
        <button className="mt-5 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white">
          Save Changes
        </button>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <h3 className="mb-3 font-semibold text-slate-900">Security</h3>
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Change Password</p>
              <p className="text-xs text-slate-400">Last changed 2 months ago</p>
            </div>
            <ChevronRight size={18} className="text-slate-400" />
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ----------------------------------- app ------------------------------------ */

export default function StudentApp({ user, onSwitchRole, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [transactions, setTransactions] = useState(INITIAL_TX);
  const [budgetLimits, setBudgetLimits] = useState(INITIAL_BUDGET_LIMITS);

  // Wallet balance is simply the running total of the ledger — no hidden
  // starting balance to fake a "real" account.
  const walletBalance = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), [transactions]);

  const weeklyLimit = 5000;
  const monthlyLimit = 18000;
  const monthlySpent = useMemo(
    () => transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions]
  );
  // Demo data has no real dates to bucket by week, so weekly spend tracks
  // the same ledger — swap in real date filtering once transactions carry
  // real timestamps.
  const weeklySpent = monthlySpent;

  const spentByCategory = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      if (t.amount < 0) map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });
    return map;
  }, [transactions]);

  // A category becomes a visible "budget" once it has a limit or any spend.
  const budgets = useMemo(
    () =>
      Object.keys(CATEGORIES)
        .filter((cat) => budgetLimits[cat] > 0 || spentByCategory[cat] > 0)
        .map((cat) => ({ category: cat, budgeted: budgetLimits[cat] || 0, spent: spentByCategory[cat] || 0 })),
    [budgetLimits, spentByCategory]
  );

  const setBudgetLimit = (category, amount) => {
    setBudgetLimits((prev) => ({ ...prev, [category]: amount }));
  };

  const addExpense = ({ merchant, category, amount }) => {
    const newTx = {
      id: Date.now(),
      merchant,
      category,
      amount,
      date: "Today",
      time: new Date().toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" }),
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const addMany = (rows) => {
    const withIds = rows.map((r, i) => ({ id: Date.now() + i, time: "", ...r }));
    setTransactions((prev) => [...withIds, ...prev]);
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return (
          <DashboardPage
            transactions={transactions}
            budgets={budgets}
            walletBalance={walletBalance}
            weeklySpent={weeklySpent}
            weeklyLimit={weeklyLimit}
            onNavigate={setPage}
          />
        );
      case "wallet":
        return (
          <WalletPage
            walletBalance={walletBalance}
            weeklySpent={weeklySpent}
            weeklyLimit={weeklyLimit}
            monthlySpent={monthlySpent}
            monthlyLimit={monthlyLimit}
          />
        );
      case "transactions":
        return <TransactionsPage transactions={transactions} />;
      case "add-expense":
        return <AddExpensePage onAddExpense={addExpense} onAddMany={addMany} />;
      case "budget":
        return <BudgetPage budgets={budgets} onSetLimit={setBudgetLimit} />;
      case "insights":
        return <InsightsPage budgets={budgets} transactions={transactions} />;
      case "notifications":
        return <NotificationsPage />;
      case "profile":
        return <ProfilePage />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-full bg-paper text-slate-900">
      <Sidebar
        active={page}
        onNavigate={setPage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onSwitchRole={onSwitchRole}
        onLogout={onLogout}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Topbar title={pageTitle(page)} onMenu={() => setMobileOpen(true)} user={user} />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <h1 className="mb-6 hidden font-display text-2xl font-bold text-slate-900 lg:block">{pageTitle(page)}</h1>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
