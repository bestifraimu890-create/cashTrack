import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Search } from "lucide-react";
import { naira, feeFor } from "../../lib/constants.js";
import { Card } from "../../components/common/index.js";

export default function AdminTransactions() {
  const { transactions } = useOutletContext();
  const [query, setQuery] = useState("");
  const filtered = transactions.filter(
    (t) =>
      (t.merchant || "").toLowerCase().includes(query.toLowerCase()) ||
      (t.user || "").toLowerCase().includes(query.toLowerCase())
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
