import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { PieChart as PieChartIcon, LineChart as LineChartIcon, Sparkles } from "lucide-react";
import { naira, CATEGORIES } from "../../lib/constants.js";
import { Card, EmptyState } from "../../components/common/index.js";

function runningBalanceSeries(transactions) {
  const chronological = [...transactions].reverse();
  let running = 0;
  return chronological.map((t, i) => {
    running += t.amount;
    return { label: `#${i + 1}`, balance: running };
  });
}

export default function Insights() {
  const { budgets, transactions } = useOutletContext();

  const pieData = budgets.map((b) => ({ name: b.category, value: b.spent })).filter((d) => d.value > 0);
  const overBudget = budgets.filter((b) => b.spent > b.budgeted);
  const trend = useMemo(() => runningBalanceSeries(transactions), [transactions]);

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
