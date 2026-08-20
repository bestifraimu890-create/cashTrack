import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LayoutGrid, Users, Wallet as WalletIcon, Receipt, Percent,
  FileBarChart2, Settings, Search, Bell, LogOut,
  ShieldCheck, Menu,
  TrendingUp, Download, Ban,
} from "lucide-react";
import { naira, Card, initialsOf } from "./shared.jsx";

/* ---------------------------------- data --------------------------------- */

// CashTrack earns revenue from a small, transparent fee on each transaction
// that moves through the platform — no subscriptions, no paywalled features.
const FEE_RATE = 0.015; // 1.5%
const FEE_CAP = 200; // ₦200 max fee per transaction
const feeFor = (amount) => Math.round(Math.min(Math.abs(amount) * FEE_RATE, FEE_CAP));

// A freshly-deployed platform starts with no users, wallets or transactions.
// Everything on this dashboard is computed live from that ledger below —
// nothing here is a fabricated headline number.
const INITIAL_USERS = [];
const INITIAL_WALLETS = [];
const INITIAL_TRANSACTIONS = [];
const REPORTS = [];

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { key: "users", label: "Users", icon: Users },
  { key: "wallets", label: "Wallets", icon: WalletIcon },
  { key: "transactions", label: "Transactions", icon: Receipt },
  { key: "revenue", label: "Revenue", icon: Percent },
  { key: "reports", label: "Reports", icon: FileBarChart2 },
];

const pageTitle = (key) => NAV.find((n) => n.key === key)?.label ?? "Dashboard";

/* --------------------------------- badges ---------------------------------- */

function StatusBadge({ status }) {
  const map = {
    active: "bg-brand-50 text-brand-700",
    suspended: "bg-red-50 text-red-600",
    frozen: "bg-blue-50 text-blue-600",
    successful: "bg-brand-50 text-brand-700",
    failed: "bg-red-50 text-red-600",
    pending: "bg-amber-50 text-amber-700",
    past_due: "bg-amber-50 text-amber-700",
  };
  const labelMap = { past_due: "Past Due" };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {labelMap[status] ?? status}
    </span>
  );
}

/* -------------------------------- sidebar --------------------------------- */

function Sidebar({ active, onNavigate, mobileOpen, setMobileOpen, onSwitchRole, onLogout }) {
  const content = (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 px-6 py-6">
        <img src="/cashtrack-logo.png" alt="CashTrack" className="h-10 w-auto" />
        <p className="text-[11px] font-medium text-slate-400 leading-tight">Super Admin</p>
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
          <Settings size={18} className="text-slate-400" />
          Platform Settings
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
          placeholder="Search users, transactions..."
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

/* ------------------------------- empty state -------------------------------- */

function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon size={20} />
      </div>
      <p className="text-sm font-semibold text-slate-800">{title}</p>
      <p className="max-w-xs text-sm text-slate-500">{body}</p>
    </div>
  );
}

/* -------------------------------- dashboard -------------------------------- */

function DashboardPage({ users, wallets, transactions }) {
  const totalWalletBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const monthlyVolume = transactions.reduce((s, t) => s + Math.abs(t.amount), 0);
  const feeRevenue = transactions.reduce((s, t) => s + feeFor(t.amount), 0);

  const userMix = useMemo(() => {
    const counts = { Student: 0, Parent: 0, Underage: 0 };
    users.forEach((u) => {
      if (counts[u.role] !== undefined) counts[u.role] += 1;
    });
    return [
      { name: "Students", value: counts.Student, color: "#5B3FA8" },
      { name: "Parents", value: counts.Parent, color: "#B07A1E" },
      { name: "Underage", value: counts.Underage, color: "#128A5D" },
    ].filter((d) => d.value > 0);
  }, [users]);

  const feeSeries = useMemo(() => {
    const chronological = [...transactions].reverse();
    let running = 0;
    return chronological.map((t, i) => {
      running += feeFor(t.amount);
      return { label: `#${i + 1}`, revenue: running };
    });
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Total Users</p>
          <p className="mt-2 text-2xl font-bold font-display tabular-nums text-slate-900">{users.length.toLocaleString()}</p>
          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
            <TrendingUp size={12} /> Live count
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Total Wallet Balance</p>
          <p className="mt-2 text-2xl font-bold font-display tabular-nums text-slate-900">{naira(totalWalletBalance)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Transaction Volume</p>
          <p className="mt-2 text-2xl font-bold font-display tabular-nums text-slate-900">{naira(monthlyVolume)}</p>
        </Card>
        <Card className="bg-brand-700 p-5 text-white">
          <p className="text-xs font-semibold uppercase text-brand-100">Fee Revenue</p>
          <p className="mt-2 text-2xl font-bold font-display tabular-nums">{naira(feeRevenue)}</p>
          <p className="mt-1 text-xs text-brand-100">{(FEE_RATE * 100).toFixed(1)}% per transaction, capped at {naira(FEE_CAP)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h3 className="mb-4 font-semibold text-slate-900">User Growth</h3>
          {users.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No users yet"
              body="This chart tracks signups over time as students and parents join the platform."
            />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{ label: "Now", users: users.length }]} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#5B3FA8" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#5B3FA8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="users" stroke="#5B3FA8" strokeWidth={2.5} fill="url(#growth)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-slate-900">User Mix</h3>
          {userMix.length === 0 ? (
            <EmptyState icon={Users} title="No users yet" body="Role breakdown appears once accounts are created." />
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={userMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={75} paddingAngle={3}>
                      {userMix.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-1.5">
                {userMix.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-medium text-slate-700">{d.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 font-semibold text-slate-900">Transaction Fee Revenue</h3>
        {feeSeries.length === 0 ? (
          <EmptyState
            icon={Percent}
            title="No revenue yet"
            body={`CashTrack earns ${(FEE_RATE * 100).toFixed(1)}% of each transaction (capped at ${naira(FEE_CAP)}). This chart fills in as transactions are processed — no subscriptions involved.`}
          />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeSeries} margin={{ left: -20, right: 10 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip formatter={(v) => naira(v)} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#5B3FA8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------------- users ---------------------------------- */

function UsersPage({ users, onToggleStatus }) {
  const [roleFilter, setRoleFilter] = useState("All");
  const [query, setQuery] = useState("");
  const filters = ["All", "Student", "Parent", "Underage"];

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesQuery = u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase());
    return matchesRole && matchesQuery;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:w-72">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                roleFilter === f ? "bg-brand-700 text-white" : "bg-white text-slate-500 border border-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Joined</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{u.role}</td>
                <td className="px-5 py-3.5 text-slate-500">{u.joined}</td>
                <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => onToggleStatus(u.id)}
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    {u.status === "active" ? "Suspend" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                  {users.length === 0 ? "No users have signed up yet." : "No users match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* --------------------------------- wallets ---------------------------------- */

function WalletsPage({ wallets, onToggleFreeze }) {
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);
  return (
    <div className="space-y-5">
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase text-slate-400">Sum of Listed Wallets</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{naira(totalBalance)}</p>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">Balance</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {wallets.map((w) => (
              <tr key={w.id}>
                <td className="px-5 py-3.5 font-medium text-slate-800">{w.user}</td>
                <td className="px-5 py-3.5 text-slate-600">{naira(w.balance)}</td>
                <td className="px-5 py-3.5"><StatusBadge status={w.status} /></td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => onToggleFreeze(w.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                  >
                    <Ban size={12} /> {w.status === "frozen" ? "Unfreeze" : "Freeze"}
                  </button>
                </td>
              </tr>
            ))}
            {wallets.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                  No wallets created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ------------------------------- transactions -------------------------------- */

function TransactionsPage({ transactions }) {
  const [query, setQuery] = useState("");
  const filtered = transactions.filter(
    (t) => t.merchant.toLowerCase().includes(query.toLowerCase()) || t.user.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:w-72">
        <Search size={16} className="text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search user or merchant..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </div>
      <Card>
        <div className="divide-y divide-slate-100">
          {filtered.map((t) => (
            <div key={t.id} className="flex items-center gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{t.merchant}</p>
                <p className="text-xs text-slate-400">{t.user} · {t.date}</p>
              </div>
              <span className="w-20 shrink-0 text-right text-xs text-gold-700">+{naira(feeFor(t.amount))} fee</span>
              <span className="w-24 shrink-0 text-right text-sm font-semibold tabular-nums text-slate-800">{naira(t.amount)}</span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-10 text-center text-sm text-slate-400">
              {transactions.length === 0 ? "No transactions have been processed yet." : "No transactions match your search."}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------- revenue ----------------------------------- */

function RevenuePage({ transactions }) {
  const totalFees = transactions.reduce((s, t) => s + feeFor(t.amount), 0);
  const totalVolume = transactions.reduce((s, t) => s + Math.abs(t.amount), 0);
  const avgFeeRate = totalVolume > 0 ? (totalFees / totalVolume) * 100 : 0;
  const topFees = [...transactions].sort((a, b) => feeFor(b.amount) - feeFor(a.amount)).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Fee Rate</p>
          <p className="mt-2 text-2xl font-bold font-display text-slate-900">{(FEE_RATE * 100).toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-500">capped at {naira(FEE_CAP)} per transaction</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Total Fee Revenue</p>
          <p className="mt-2 text-2xl font-bold font-display tabular-nums text-slate-900">{naira(totalFees)}</p>
        </Card>
        <Card className="bg-brand-700 p-5 text-white">
          <p className="text-xs font-semibold uppercase text-brand-100">Effective Rate</p>
          <p className="mt-2 text-2xl font-bold font-display tabular-nums">{avgFeeRate.toFixed(2)}%</p>
          <p className="mt-1 text-xs text-brand-100">of {naira(totalVolume)} in volume</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-2 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-600">
            <Percent size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">How CashTrack makes money</p>
            <p className="mt-1 text-sm text-slate-500">
              A {(FEE_RATE * 100).toFixed(1)}% fee (capped at {naira(FEE_CAP)}) is deducted from platform revenue on every
              transaction — wallet spend, transfers and fund requests alike. There are no subscriptions and no locked
              features; every user gets the full product.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        {topFees.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No fee-generating transactions yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {topFees.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{t.merchant}</p>
                  <p className="text-xs text-slate-400">{t.user} · {t.date}</p>
                </div>
                <span className="text-xs text-slate-400">on {naira(t.amount)}</span>
                <span className="w-20 text-right text-sm font-semibold text-gold-700">{naira(feeFor(t.amount))}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------------- reports ----------------------------------- */

function ReportsPage({ reports }) {
  return (
    <Card>
      {reports.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={FileBarChart2}
            title="No reports generated yet"
            body="Platform, revenue and growth reports will appear here once there's activity to summarize."
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {reports.map((r) => (
            <div key={r.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <FileBarChart2 size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{r.name}</p>
                <p className="text-xs text-slate-400">{r.type} · {r.date}</p>
              </div>
              <button className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700">
                <Download size={13} /> Export
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

/* ----------------------------------- app ------------------------------------ */

export default function AdminApp({ user, onSwitchRole, onLogout }) {
  const [page, setPage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [wallets, setWallets] = useState(INITIAL_WALLETS);
  const [transactions] = useState(INITIAL_TRANSACTIONS);

  const toggleUserStatus = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u))
    );
  };

  const toggleWalletFreeze = (id) => {
    setWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: w.status === "frozen" ? "active" : "frozen" } : w))
    );
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <DashboardPage users={users} wallets={wallets} transactions={transactions} />;
      case "users":
        return <UsersPage users={users} onToggleStatus={toggleUserStatus} />;
      case "wallets":
        return <WalletsPage wallets={wallets} onToggleFreeze={toggleWalletFreeze} />;
      case "transactions":
        return <TransactionsPage transactions={transactions} />;
      case "revenue":
        return <RevenuePage transactions={transactions} />;
      case "reports":
        return <ReportsPage reports={REPORTS} />;
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
