import React from "react";
import { useOutletContext } from "react-router-dom";
import { Percent } from "lucide-react";
import { naira, FEE_RATE, FEE_CAP, feeFor } from "../../lib/constants.js";
import { Card } from "../../components/common/index.js";

export default function Revenue() {
  const { transactions } = useOutletContext();

  const totalFees = transactions.reduce((s, t) => s + feeFor(t.amount), 0);
  const totalVolume = transactions.reduce((s, t) => s + Math.abs(t.amount), 0);
  const avgFeeRate = totalVolume > 0 ? (totalFees / totalVolume) * 100 : 0;
  const topFees = [...transactions].sort((a, b) => feeFor(b.amount) - feeFor(a.amount)).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Fee Rate</p>
          <p className="mt-2 text-2xl font-bold font-display text-slate-900">{(FEE_RATE * 100).toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-500">capped at {naira(FEE_CAP)} per transaction</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase text-slate-400">Total Fee Revenue</p>
          <p className="mt-2 text-2xl font-bold font-display tabular-nums text-slate-900">{naira(totalFees)}</p>
        </Card>
        <Card className="bg-brand-700 p-5 text-white">
          <p className="text-xs font-semibold uppercase text-brand-100">Effective Rate</p>
          <p className="mt-2 text-2xl font-bold font-display tabular-nums">{avgFeeRate.toFixed(2)}%</p>
          <p className="mt-1 text-xs text-brand-100">of {naira(totalVolume)} in volume</p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-2 flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-50 text-gold-600">
            <Percent size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">How CashTrack makes money</p>
            <p className="mt-1 text-sm text-slate-500">
              A {(FEE_RATE * 100).toFixed(1)}% fee (capped at {naira(FEE_CAP)}) is deducted from platform revenue on every
              transaction — wallet spend, transfers and fund requests alike. There are no subscriptions and no locked
              features; every user gets the full product.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        {topFees.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No fee-generating transactions yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {topFees.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{t.merchant}</p>
                  <p className="text-xs text-slate-400">{t.user} · {t.date}</p>
                </div>
                <span className="text-xs text-slate-400">on {naira(t.amount)}</span>
                <span className="w-20 text-right text-sm font-semibold text-gold-700">{naira(feeFor(t.amount))}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
