import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Search } from "lucide-react";
import { naira } from "../../lib/constants.js";
import { Card, CategoryIcon } from "../../components/common/index.js";

export default function ParentTransactions() {
  const { allTransactions } = useOutletContext();
  const [query, setQuery] = useState("");

  const filtered = allTransactions.filter((t) => {
    return (t.merchant || "").toLowerCase().includes(query.toLowerCase());
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
      </div>

      <Card>
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">
            {allTransactions.length === 0
              ? "No transactions yet. Spending from your linked children will appear here."
              : "No transactions match your search."}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                <CategoryIcon category={t.category} size={17} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{t.merchant}</p>
                  <p className="text-xs text-slate-400">{t.category} · {new Date(t.created_at).toLocaleDateString("en-NG")}</p>
                </div>
                <span className={`text-sm font-semibold ${t.amount > 0 ? "text-mint-600" : "text-slate-800"}`}>
                  {t.amount > 0 ? "+" : ""}
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
