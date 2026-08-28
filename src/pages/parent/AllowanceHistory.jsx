import React from "react";
import { useOutletContext } from "react-router-dom";
import { Send } from "lucide-react";
import { naira } from "../../lib/constants.js";
import { Card, EmptyState } from "../../components/common/index.js";

export default function AllowanceHistory() {
  const { allowanceHistory } = useOutletContext();

  return (
    <Card>
      {allowanceHistory.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-400">No transfers yet.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {allowanceHistory.map((h) => (
            <div key={h.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Send size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">{h.merchant}</p>
                <p className="text-xs text-slate-400">{h.category} · {new Date(h.created_at).toLocaleDateString("en-NG")}</p>
              </div>
              <span className="text-sm font-semibold text-mint-600">+{naira(h.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
