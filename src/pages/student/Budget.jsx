import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { PiggyBank, PlusCircle } from "lucide-react";
import { naira, CATEGORIES } from "../../lib/constants.js";
import { Card, CategoryIcon, ProgressBar, EmptyState } from "../../components/common/index.js";

export default function Budget() {
  const { budgets, setBudgetLimit } = useOutletContext();
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
    setBudgetLimit(newCategory, value);
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
