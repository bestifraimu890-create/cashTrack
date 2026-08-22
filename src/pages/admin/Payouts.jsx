import React, { useEffect, useState } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { supabase } from "../../supabase/client.js";
import { edgeCall } from "../../supabase/edge.js";
import { naira } from "../../lib/constants.js";
import { Card } from "../../components/common/index.js";

const PAYOUT_STATUS = {
  pending_otp: { label: "Awaiting OTP", cls: "bg-amber-50 text-amber-700" },
  processing: { label: "Processing", cls: "bg-blue-50 text-blue-600" },
  completed: { label: "Completed", cls: "bg-brand-50 text-brand-700" },
  failed: { label: "Failed", cls: "bg-red-50 text-red-600" },
  rejected: { label: "Rejected", cls: "bg-red-50 text-red-600" },
};

export default function Payouts() {
  const [payouts, setPayouts] = useState([]);
  const [otp, setOtp] = useState({});
  const [banner, setBanner] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    const { data } = await supabase
      .from("payouts")
      .select("*, wallets(owner_id)")
      .order("created_at", { ascending: false })
      .limit(50);
    setPayouts(data ?? []);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  const approve = async (p) => {
    const code = (otp[p.id] ?? "").trim();
    if (!code) {
      setBanner("Enter the OTP that was emailed to the Monnify account before approving.");
      return;
    }
    setBusyId(p.id);
    setBanner(null);
    try {
      await edgeCall("confirm-payout", { action: "approve", payoutId: p.id, otp: code });
      setBanner("Approved — Monnify is processing the transfer.");
      load();
    } catch (e) {
      setBanner(`Approval failed: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const resend = async (p) => {
    setBusyId(p.id);
    setBanner(null);
    try {
      await edgeCall("confirm-payout", { action: "resend", payoutId: p.id });
      setBanner("OTP resent — check the Monnify account email.");
    } catch (e) {
      setBanner(`Resend failed: ${e.message}`);
    } finally {
      setBusyId(null);
    }
  };

  const pending = payouts.filter((p) => p.status === "pending_otp").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Student withdrawal requests. Approve by entering the OTP emailed to the Monnify account owner.
        </p>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          {pending} awaiting approval
        </span>
      </div>

      {banner && (
        <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          <ShieldCheck size={16} /> {banner}
        </div>
      )}

      <Card className="p-0">
        {payouts.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No payout requests yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payouts.map((p) => {
              const s = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.pending_otp;
              return (
                <div key={p.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                      <Send size={15} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">
                        {naira(p.amount)}{" "}
                        <span className="font-normal text-slate-400">→ {p.account_name}</span>
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {p.bank_name || "Bank"} · {p.account_number} ·{" "}
                        {new Date(p.created_at).toLocaleString("en-NG")}
                      </p>
                    </div>
                  </div>

                  {p.status === "pending_otp" ? (
                    <div className="flex items-center gap-2">
                      <input
                        value={otp[p.id] ?? ""}
                        onChange={(e) => setOtp((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        placeholder="OTP"
                        inputMode="numeric"
                        className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                      />
                      <button
                        onClick={() => approve(p)}
                        disabled={busyId === p.id}
                        className="rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => resend(p)}
                        disabled={busyId === p.id}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    </div>
                  ) : (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>{s.label}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
