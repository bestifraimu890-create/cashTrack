import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LayoutGrid, Users, Send, History, SlidersHorizontal, Receipt,
  LineChart as LineChartIcon, Bell, ShieldAlert, LogOut, Search,
  HelpCircle, CheckCircle2, AlertTriangle,
  Menu, Baby, GraduationCap, PlusCircle, Check,
  PieChart as PieChartIcon,
} from "lucide-react";
import { CATEGORIES, naira, Card, CategoryIcon, ProgressBar } from "./shared.jsx";

/* ---------------------------------- data --------------------------------- */

const PARENT = { name: "Ngozi Okafor" };

const INITIAL_CHILDREN = [
  {
    id: "c1",
    name: "",
    school: "",
    type: "Student",
    underage: false,
    balance: 0,
    dailyLimit: 1000,
    weeklyLimit: 5000,
    weeklySpent: 0,
    monthlyLimit: 18000,
    monthlySpent: 0,
    status: "active",
  },
  {
    id: "c2",
    name: "",
    school: "",
    type: "Underage Student",
    underage: true,
    balance: 0,
    dailyLimit: 500,
    weeklyLimit: 2000,
    weeklySpent: 0,
    monthlyLimit: 7000,
    monthlySpent: 0,
    status: "active",
  },
];

// Fresh parent accounts start with no funding history, no logged spend, and
// no alerts — these fill in as the linked children use their wallets.
const INITIAL_ALLOWANCE_HISTORY = [];
const TRANSACTIONS = [];
const INITIAL_ALERTS = [];

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "children", label: "Children", icon: Users },
  { key: "fund", label: "Fund Wallet", icon: Send },
  { key: "allowance", label: "Allowance History", icon: History },
  { key: "limits", label: "Spending Limits", icon: SlidersHorizontal },
  { key: "transactions", label: "Transactions", icon: Receipt },
  { key: "insights", label: "Insights", icon: LineChartIcon },
  { key: "alerts", label: "Alerts", icon: Bell },
  { key: "controls", label: "Parental Controls", icon: ShieldAlert },
];

const pageTitle = (key) => NAV.find((n) => n.key === key)?.label ?? "Dashboard";

/* -------------------------------- sidebar --------------------------------- */

function Sidebar({ active, onNavigate, mobileOpen, setMobileOpen, onSwitchRole, alertCount, onLogout }) {
  const content = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
          <Users size={18} />
        </div>
        <div>
          <p className="text-lg font-bold font-display leading-tight text-slate-900">CashTrack</p>
          <p className="text-[11px] font-medium text-slate-400 leading-tight">Parent</p>
        </div>
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
              {key === "alerts" && alertCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                  {alertCount}
                </span>
              )}
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

function Topbar({ title, onMenu }) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-paper/80 px-4 py-4 backdrop-blur lg:px-8">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
        <Menu size={20} />
      </button>
      <h1 className="text-lg font-bold font-display text-slate-900 lg:hidden">{title}</h1>
      <div className="ml-auto hidden flex-1 max-w-sm items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 lg:flex">
        <Search size={16} className="text-slate-400" />
        <input
          placeholder="Search children, transactions..."
          className="w-full bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
        />
      </div>
      <button className="ml-auto relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
        <Bell size={19} />
      </button>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-700 text-sm font-semibold text-white">
        NO
      </div>
    </div>
  );
}

/* --------------------------------- child card ------------------------------ */

function ChildAvatar({ child, size = 40 }) {
  const initials = child.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </div>
  );
}

/* -------------------------------- empty state ------------------------------ */

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

/* -------------------------------- dashboard -------------------------------- */

function DashboardPage({ children, alerts, onNavigate }) {
  const totalBalance = children.reduce((s, c) => s + c.balance, 0);
  const totalWeeklySpent = children.reduce((s, c) => s + c.weeklySpent, 0);
  const totalWeeklyLimit = children.reduce((s, c) => s + c.weeklyLimit, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Welcome back, {PARENT.name.split(" ")[0]}.</h2>
        <p className="mt-1 text-sm text-slate-500">
          Here's how {children.length === 1 ? "your child is" : "your children are"} doing this week.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Combined Balance</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{naira(totalBalance)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Spent This Week</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{naira(totalWeeklySpent)}</p>
          <div className="mt-2"><ProgressBar value={totalWeeklySpent} max={totalWeeklyLimit} /></div>
        </Card>
        <Card className="bg-brand-700 p-5 text-white">
          <p className="text-xs font-semibold uppercase text-brand-100">Children Connected</p>
          <p className="mt-2 text-2xl font-bold">{children.length}</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Children Overview</h3>
          <button onClick={() => onNavigate("children")} className="text-xs font-semibold text-brand-700">
            Manage
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {children.map((c) => {
            const over = c.weeklySpent > c.weeklyLimit;
            return (
              <div key={c.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <ChildAvatar child={c} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{c.name}</p>
                    <p className="truncate text-xs text-slate-400">{c.school}</p>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{naira(c.balance)}</span>
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-slate-500">
                    <span>Weekly limit</span>
                    <span className={over ? "font-semibold text-red-600" : ""}>
                      {naira(c.weeklySpent)} / {naira(c.weeklyLimit)}
                    </span>
                  </div>
                  <ProgressBar value={c.weeklySpent} max={c.weeklyLimit} danger={over} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Recent Alerts</h3>
          <button onClick={() => onNavigate("alerts")} className="text-xs font-semibold text-brand-700">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No alerts yet"
              body="Budget warnings and fund requests from your children will show up here."
            />
          ) : (
            alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-start gap-3">
                {a.type === "alert" ? (
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
                ) : a.type === "approval" ? (
                  <Send size={16} className="mt-0.5 shrink-0 text-amber-500" />
                ) : (
                  <Bell size={16} className="mt-0.5 shrink-0 text-blue-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-500">{a.body}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

/* --------------------------------- children --------------------------------- */

function ChildrenPage({ children }) {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{children.length} children connected to your account</p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
        >
          <PlusCircle size={15} /> Connect a Child
        </button>
      </div>

      {showAdd && (
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900">Connect a Child</h3>
          <p className="mt-1 text-sm text-slate-500">
            Ask your child to generate a connection code from their CashTrack app, then enter it below.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              placeholder="Enter 6-digit connection code"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
            <button className="rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white">
              Send Request
            </button>
          </div>
          <button onClick={() => setShowAdd(false)} className="mt-3 text-xs font-medium text-slate-400">
            Cancel
          </button>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {children.map((c) => (
          <Card key={c.id} className="p-6">
            <div className="flex items-center gap-3">
              <ChildAvatar child={c} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{c.name}</p>
                <p className="truncate text-xs text-slate-400">{c.school}</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {c.underage ? <Baby size={12} /> : <GraduationCap size={12} />}
                {c.type}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Balance</p>
                <p className="text-sm font-bold text-slate-800">{naira(c.balance)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">Weekly Limit</p>
                <p className="text-sm font-bold text-slate-800">{naira(c.weeklyLimit)}</p>
              </div>
            </div>
            <span
              className={`mt-4 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                c.status === "active" ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              <Check size={12} /> {c.status === "active" ? "Active" : "Pending approval"}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------- fund wallet -------------------------------- */

function FundWalletPage({ children, onFund }) {
  const [childId, setChildId] = useState(children[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [banner, setBanner] = useState(null);
  const quickAmounts = [500, 1000, 2000, 5000];

  const submit = (e) => {
    e.preventDefault();
    const value = parseFloat(amount);
    const child = children.find((c) => c.id === childId);
    if (!child || !value || value <= 0) {
      setBanner({ type: "error", text: "Choose a child and a valid amount." });
      return;
    }
    onFund(childId, value, note);
    setBanner({ type: "success", text: `${naira(value)} sent to ${child.name}.` });
    setAmount("");
    setNote("");
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <h3 className="font-semibold text-slate-900">Send money to a child's wallet</h3>
        <p className="mt-1 text-sm text-slate-500">Funds are available in their wallet immediately.</p>

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
            <label className="mb-1 block text-xs font-semibold text-slate-500">Child</label>
            <select
              value={childId}
              onChange={(e) => setChildId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            >
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
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
            <div className="mt-2 flex flex-wrap gap-2">
              {quickAmounts.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(String(a))}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 hover:border-brand-400 hover:text-brand-700"
                >
                  {naira(a)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Note (optional)</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Weekly allowance"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <button type="submit" className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white">
            Send Funds
          </button>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-slate-900">Funding Source</h3>
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-100 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
            GTB
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">GTBank •••• 4821</p>
            <p className="text-xs text-slate-400">Default payment method</p>
          </div>
        </div>
        <button className="mt-3 text-xs font-semibold text-brand-700">+ Add another payment method</button>
      </Card>
    </div>
  );
}

/* ------------------------------ allowance history ---------------------------- */

function AllowanceHistoryPage({ history }) {
  return (
    <Card>
      {history.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-400">No transfers yet.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Send size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">{h.child}</p>
                <p className="text-xs text-slate-400">{h.note} · {h.date}</p>
              </div>
              <span className="text-sm font-semibold text-mint-600">+{naira(h.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ------------------------------- spending limits ------------------------------ */

function SpendingLimitsPage({ children, onUpdateLimits }) {
  const [banner, setBanner] = useState(null);

  const handleSave = (id, field, value) => {
    const num = parseFloat(value);
    if (Number.isNaN(num) || num < 0) return;
    onUpdateLimits(id, field, num);
  };

  return (
    <div className="space-y-5">
      {banner && (
        <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          <CheckCircle2 size={16} /> {banner}
        </div>
      )}
      {children.map((c) => (
        <Card key={c.id} className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <ChildAvatar child={c} />
            <div>
              <p className="font-semibold text-slate-900">{c.name}</p>
              <p className="text-xs text-slate-400">{c.type}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { key: "dailyLimit", label: "Daily Limit" },
              { key: "weeklyLimit", label: "Weekly Limit" },
              { key: "monthlyLimit", label: "Monthly Limit" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <span className="text-sm text-slate-400">₦</span>
                  <input
                    type="number"
                    min="0"
                    defaultValue={c[key]}
                    onBlur={(e) => {
                      handleSave(c.id, key, e.target.value);
                      setBanner(`${label} updated for ${c.name}.`);
                    }}
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* --------------------------------- transactions ------------------------------- */

function TransactionsPage({ transactions, children }) {
  const [childFilter, setChildFilter] = useState("All");
  const [query, setQuery] = useState("");
  const filters = ["All", ...children.map((c) => c.name)];

  const filtered = transactions.filter((t) => {
    const matchesChild = childFilter === "All" || t.child === childFilter;
    const matchesQuery = t.merchant.toLowerCase().includes(query.toLowerCase());
    return matchesChild && matchesQuery;
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
              onClick={() => setChildFilter(f)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                childFilter === f ? "bg-brand-700 text-white" : "bg-white text-slate-500 border border-slate-200"
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
              ? "No spending logged by your children yet."
              : "No transactions match your filters."}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                <CategoryIcon category={t.category} size={17} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{t.merchant}</p>
                  <p className="text-xs text-slate-400">{t.child} · {t.category} · {t.date}</p>
                </div>
                <span className="text-sm font-semibold text-slate-800">{naira(t.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------------- insights ----------------------------------- */

function InsightsPage({ children, transactions }) {
  const byChild = children.map((c) => ({
    name: c.name.split(" ")[0],
    spent: transactions.filter((t) => t.child === c.name).reduce((s, t) => s + Math.abs(t.amount), 0),
  }));
  const hasChildSpend = byChild.some((c) => c.spent > 0);

  const byCategory = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const trend = useMemo(() => {
    const chronological = [...transactions].reverse();
    let running = 0;
    return chronological.map((t, i) => {
      running += Math.abs(t.amount);
      return { label: `#${i + 1}`, spent: running };
    });
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-slate-900">Spending by Child</h3>
          {hasChildSpend ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byChild} margin={{ left: -20, right: 10 }}>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip formatter={(v) => naira(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="spent" fill="#5B3FA8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No spending yet"
              body="Once your children start spending from their wallets, you'll see a breakdown here."
            />
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-slate-900">Spending by Category</h3>
          {byCategory.length === 0 ? (
            <EmptyState
              icon={PieChartIcon}
              title="Nothing to show yet"
              body="Category breakdowns appear as soon as spending is logged."
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {byCategory.map((d) => (
                      <Cell key={d.name} fill={CATEGORIES[d.name]?.color ?? "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => naira(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-slate-900">Household Spending Trend</h3>
        {trend.length === 0 ? (
          <EmptyState
            icon={LineChartIcon}
            title="No trend data yet"
            body="This fills in automatically as your household's spending is logged over time."
          />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -20, right: 10 }}>
                <defs>
                  <linearGradient id="parentTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5B3FA8" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#5B3FA8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip formatter={(v) => naira(v)} />
                <Area type="monotone" dataKey="spent" stroke="#5B3FA8" strokeWidth={2.5} fill="url(#parentTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ----------------------------------- alerts ------------------------------------ */

function AlertsPage({ alerts, onRespond }) {
  const iconFor = (type) =>
    type === "alert" ? (
      <AlertTriangle size={16} className="text-red-500" />
    ) : type === "approval" ? (
      <Send size={16} className="text-amber-500" />
    ) : (
      <Bell size={16} className="text-blue-500" />
    );

  return (
    <Card>
      <div className="divide-y divide-slate-100">
        {alerts.map((a) => (
          <div key={a.id} className="flex gap-3 px-5 py-4">
            <div className="mt-0.5">{iconFor(a.type)}</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-800">{a.title}</p>
              <p className="mt-0.5 text-sm text-slate-500">{a.body}</p>
              {a.type === "approval" && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => onRespond(a.id, "approved")}
                    className="rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onRespond(a.id, "declined")}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
            <span className="whitespace-nowrap text-xs text-slate-400">{a.time}</span>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="p-10 text-center text-sm text-slate-400">You're all caught up.</div>
        )}
      </div>
    </Card>
  );
}

/* ------------------------------- parental controls ------------------------------ */

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors ${checked ? "bg-brand-700" : "bg-slate-200"}`}
    >
      <div className={`h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : ""}`} />
    </button>
  );
}

function ParentalControlsPage({ children }) {
  const [selected, setSelected] = useState(children[0]?.id ?? "");
  const [settings, setSettings] = useState(
    Object.fromEntries(
      children.map((c) => [
        c.id,
        {
          requireApproval: c.underage,
          approvalThreshold: 5000,
          blockEntertainment: false,
          allowCsvImport: !c.underage,
          notifyOnEveryTransaction: c.underage,
        },
      ])
    )
  );

  const child = children.find((c) => c.id === selected);
  const current = settings[selected] || {};

  const update = (key, value) =>
    setSettings((prev) => ({ ...prev, [selected]: { ...prev[selected], [key]: value } }));

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {children.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium ${
              selected === c.id ? "bg-brand-700 text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {child && (
        <Card className="divide-y divide-slate-100">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-800">Require approval for purchases</p>
              <p className="text-xs text-slate-400">
                {child.name} must get your approval before spending above the threshold
              </p>
            </div>
            <Toggle checked={current.requireApproval} onChange={(v) => update("requireApproval", v)} />
          </div>

          {current.requireApproval && (
            <div className="flex items-center justify-between p-5">
              <p className="text-sm font-medium text-slate-800">Approval threshold</p>
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
                <span className="text-sm text-slate-400">₦</span>
                <input
                  type="number"
                  min="0"
                  value={current.approvalThreshold}
                  onChange={(e) => update("approvalThreshold", parseFloat(e.target.value) || 0)}
                  className="w-24 bg-transparent text-sm outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-800">Block Entertainment category</p>
              <p className="text-xs text-slate-400">Prevent spending on Entertainment purchases entirely</p>
            </div>
            <Toggle checked={current.blockEntertainment} onChange={(v) => update("blockEntertainment", v)} />
          </div>

          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-800">Allow CSV import</p>
              <p className="text-xs text-slate-400">Let {child.name} bulk-import expenses from a spreadsheet</p>
            </div>
            <Toggle checked={current.allowCsvImport} onChange={(v) => update("allowCsvImport", v)} />
          </div>

          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-800">Notify on every transaction</p>
              <p className="text-xs text-slate-400">Get an alert for each purchase, not just limit breaches</p>
            </div>
            <Toggle
              checked={current.notifyOnEveryTransaction}
              onChange={(v) => update("notifyOnEveryTransaction", v)}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

/* ------------------------------------- app -------------------------------------- */

export default function ParentApp({ onSwitchRole, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [children, setChildren] = useState(INITIAL_CHILDREN);
  const [history, setHistory] = useState(INITIAL_ALLOWANCE_HISTORY);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  const fundWallet = (childId, amount, note) => {
    const child = children.find((c) => c.id === childId);
    if (!child) return;
    setChildren((prev) =>
      prev.map((c) => (c.id === childId ? { ...c, balance: c.balance + amount } : c))
    );
    setHistory((prev) => [
      { id: Date.now(), child: child.name, amount, date: "Today", note: note || "Wallet funding" },
      ...prev,
    ]);
  };

  const updateLimits = (childId, field, value) => {
    setChildren((prev) => prev.map((c) => (c.id === childId ? { ...c, [field]: value } : c)));
  };

  const respondToAlert = (id, decision) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <DashboardPage children={children} alerts={alerts} onNavigate={setPage} />;
      case "children":
        return <ChildrenPage children={children} />;
      case "fund":
        return <FundWalletPage children={children} onFund={fundWallet} />;
      case "allowance":
        return <AllowanceHistoryPage history={history} />;
      case "limits":
        return <SpendingLimitsPage children={children} onUpdateLimits={updateLimits} />;
      case "transactions":
        return <TransactionsPage transactions={TRANSACTIONS} children={children} />;
      case "insights":
        return <InsightsPage children={children} transactions={TRANSACTIONS} />;
      case "alerts":
        return <AlertsPage alerts={alerts} onRespond={respondToAlert} />;
      case "controls":
        return <ParentalControlsPage children={children} />;
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
        alertCount={alerts.length}
        onLogout={onLogout}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Topbar title={pageTitle(page)} onMenu={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 lg:px-8">
          <h1 className="mb-6 hidden font-display text-2xl font-bold text-slate-900 lg:block">{pageTitle(page)}</h1>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
