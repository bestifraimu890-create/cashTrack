import React from "react";
import { FileBarChart2, Download } from "lucide-react";
import { Card, EmptyState } from "../../components/common/index.js";

export default function Reports() {
  const reports = [];

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
