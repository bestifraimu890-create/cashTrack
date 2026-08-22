import React from "react";
import { useOutletContext } from "react-router-dom";
import { Ban } from "lucide-react";
import { naira } from "../../lib/constants.js";
import { Card, StatusBadge } from "../../components/common/index.js";

export default function Wallets() {
  const { wallets, toggleWalletFreeze } = useOutletContext();
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <p className="text-xs font-semibold uppercase text-slate-400">Sum of Listed Wallets</p>
        <p className="mt-2 text-2xl font-bold text-slate-900">{naira(totalBalance)}</p>
      </Card>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">Balance</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {wallets.map((w) => (
              <tr key={w.id}>
                <td className="px-5 py-3.5 font-medium text-slate-800">{w.user}</td>
                <td className="px-5 py-3.5 text-slate-600">{naira(w.balance)}</td>
                <td className="px-5 py-3.5"><StatusBadge status={w.status} /></td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => toggleWalletFreeze(w.id)}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                  >
                    <Ban size={12} /> {w.status === "frozen" ? "Unfreeze" : "Freeze"}
                  </button>
                </td>
              </tr>
            ))}
            {wallets.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-400">
                  No wallets created yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
