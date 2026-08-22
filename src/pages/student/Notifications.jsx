import React from "react";
import { useOutletContext } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Bell } from "lucide-react";
import { Card, EmptyState } from "../../components/common/index.js";

export default function Notifications() {
  const { notifications } = useOutletContext();

  const iconFor = (type) =>
    type === "alert" ? (
      <AlertTriangle size={16} className="text-red-500" />
    ) : type === "success" ? (
      <CheckCircle2 size={16} className="text-mint-600" />
    ) : (
      <Bell size={16} className="text-blue-500" />
    );

  return (
    <Card>
      {notifications.length === 0 ? (
        <div className="p-4">
          <EmptyState
            icon={Bell}
            title="You're all caught up"
            body="Budget alerts, fund requests and account updates will show up here."
          />
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {notifications.map((n) => (
            <div key={n.id} className="flex gap-3 px-5 py-4">
              <div className="mt-0.5">{iconFor(n.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{n.body}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-slate-400">{n.time}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
