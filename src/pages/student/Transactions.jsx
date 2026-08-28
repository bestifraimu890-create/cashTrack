import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Search, Send, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { naira, CATEGORIES } from "../../lib/constants.js";
import { Card, CategoryIcon } from "../../components/common/index.js";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

export default function Transactions() {
  const { transactions, payouts } = useOutletContext();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");

  const allItems = [
    ...transactions.map((t) => ({
      id: `tx-${t.id}`,
      type: "expense",
      title: t.merchant,
      subtitle: t.category,
      amount: t.amount,
      time: t.created_at,
      category: t.category,
    })),
    ...payouts.map((p) => ({
      id: `px-${p.id}`,
      type: "withdrawal",
      title: `Withdrawal → ${p.bank_name || "Bank"}`,
      subtitle: p.account_number,
      amount: -Math.abs(p.amount),
      time: p.created_at,
      category: null,
      status: p.status,
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time));

  const filters = ["All", "Expenses", "Withdrawals", ...Object.keys(CATEGORIES)];

  const filtered = allItems.filter((t) => {
    let matchesFilter = true;
    if (filter === "All") matchesFilter = true;
    else if (filter === "Expenses") matchesFilter = t.type === "expense";
    else if (filter === "Withdrawals") matchesFilter = t.type === "withdrawal";
    else matchesFilter = t.category === filter;

    const matchesQuery = (t.title || "").toLowerCase().includes(query.toLowerCase());
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
            placeholder="Search..."
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
            {allItems.length === 0
              ? "No transactions yet. Add an expense or make a withdrawal to get started."
              : "No transactions match your filters."}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  {t.type === "withdrawal" ? <Send size={15} /> : <CategoryIcon category={t.category} size={17} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{t.title}</p>
                  <p className="text-xs text-slate-400">
                    {t.subtitle} · {timeAgo(t.time)}
                    {t.type === "withdrawal" && t.status && (
                      <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        t.status === "completed" ? "bg-mint-50 text-mint-700"
                        : t.status === "failed" || t.status === "rejected" ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-700"
                      }`}>
                        {t.status}
                      </span>
                    )}
                  </p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${t.amount > 0 ? "text-mint-600" : "text-slate-800"}`}>
                  {t.amount > 0 ? "+" : "-"}
                  {naira(Math.abs(t.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
