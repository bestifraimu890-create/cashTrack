import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Search } from "lucide-react";
import { naira, CATEGORIES } from "../../lib/constants.js";
import { Card, CategoryIcon } from "../../components/common/index.js";

export default function Transactions() {
  const { transactions } = useOutletContext();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const filters = ["All", ...Object.keys(CATEGORIES), "Income"];

  const filtered = transactions.filter((t) => {
    const matchesFilter = filter === "All" || t.category === filter;
    const matchesQuery = (t.merchant || "").toLowerCase().includes(query.toLowerCase());
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
                    {t.category} · {new Date(t.created_at).toLocaleDateString("en-NG")}
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
