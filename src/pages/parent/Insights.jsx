import React, { useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { PieChart as PieChartIcon, LineChart as LineChartIcon } from "lucide-react";
import { naira, CATEGORIES } from "../../lib/constants.js";
import { Card, EmptyState } from "../../components/common/index.js";

export default function ParentInsights() {
  const { allTransactions } = useOutletContext();

  const byCategory = useMemo(() => {
    const map = {};
    allTransactions.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [allTransactions]);

  const trend = useMemo(() => {
    const chronological = [...allTransactions].reverse();
    let running = 0;
    return chronological.map((t, i) => {
      running += Math.abs(t.amount);
      return { label: `#${i + 1}`, spent: running };
    });
  }, [allTransactions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
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

        <Card className="p-6">
          <h3 className="mb-4 font-semibold text-slate-900">Spending Trend</h3>
          {trend.length === 0 ? (
            <EmptyState
              icon={LineChartIcon}
              title="No trend data yet"
              body="This fills in automatically as spending is logged over time."
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
    </div>
  );
}
