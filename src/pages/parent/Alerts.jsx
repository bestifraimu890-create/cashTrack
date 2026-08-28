import React from "react";
import { useOutletContext } from "react-router-dom";
import { AlertTriangle, Send, Bell, CheckCircle2 } from "lucide-react";
import { Card } from "../../components/common/index.js";

export default function Alerts() {
  const { alerts } = useOutletContext();

  const iconFor = (type) =>
    type === "alert" ? (
      <AlertTriangle size={16} className="text-red-500" />
    ) : type === "approval" ? (
      <Send size={16} className="text-amber-500" />
    ) : type === "success" ? (
      <CheckCircle2 size={16} className="text-mint-600" />
    ) : (
      <Bell size={16} className="text-blue-500" />
    );

  return (
    <Card>
      {alerts.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-400">You're all caught up.</div>
      ) : (
        <div className="divide-y divide-slate-100">
          {alerts.map((a) => (
            <div key={a.id} className="flex gap-3 px-5 py-4">
              <div className="mt-0.5">{iconFor(a.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{a.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{a.body}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-slate-400">{a.time}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
