import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users as UsersIcon, Percent, TrendingUp } from "lucide-react";
import { naira, FEE_RATE, FEE_CAP, feeFor } from "../../lib/constants.js";
import { Card, EmptyState } from "../../components/common/index.js";

export default function AdminDashboard() {
  const { users, wallets, transactions } = useOutletContext();

  const totalWalletBalance = wallets.reduce((s, w) => s + w.balance, 0);
  const monthlyVolume = transactions.reduce((s, t) => s + Math.abs(t.amount), 0);
  const feeRevenue = transactions.reduce((s, t) => s + feeFor(t.amount), 0);

  const userMix = useMemo(() => {
    const counts = { Student: 0, Parent: 0, Admin: 0 };
    users.forEach((u) => {
      if (counts[u.role] !== undefined) counts[u.role] += 1;
    });
    return [
      { name: "Students", value: counts.Student, color: "#5B3FA8" },
      { name: "Parents", value: counts.Parent, color: "#B07A1E" },
      { name: "Admins", value: counts.Admin, color: "#128A5D" },
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
              icon={UsersIcon}
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
            <EmptyState icon={UsersIcon} title="No users yet" body="Role breakdown appears once accounts are created." />
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
            body={`CashTrack earns ${(FEE_RATE * 100).toFixed(1)}% of each transaction (capped at ${naira(FEE_CAP)}). This chart fills in as transactions are processed.`}
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
