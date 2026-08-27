import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "../../supabase/client.js";
import { edgeCall } from "../../supabase/edge.js";
import { naira, PAYOUT_STATUS } from "../../lib/constants.js";
import { Card, LoadingButton } from "../../components/common/index.js";

export default function Withdraw() {
  const { user, wallet, parentLinked, parentName, householdControls } = useOutletContext();
  const [banks, setBanks] = useState([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState("");
  const [amount, setAmount] = useState("");
  const [payouts, setPayouts] = useState([]);
  const [todaySpent, setTodaySpent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [banner, setBanner] = useState(null);

  const loadPayouts = async () => {
    if (!wallet?.id) return;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todayPx } = await supabase
      .from("payouts")
      .select("amount")
      .eq("wallet_id", wallet.id)
      .gte("created_at", todayStart.toISOString())
      .not("status", "in", "(failed,rejected)");
    setTodaySpent((todayPx ?? []).reduce((s, p) => s + Number(p.amount), 0));

    const { data: px } = await supabase
      .from("payouts")
      .select("*")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: false })
      .limit(10);
    setPayouts(px ?? []);
  };

  useEffect(() => {
    edgeCall("validate-account", { action: "banks" })
      .then((r) => setBanks(r.banks ?? []))
      .catch((e) => setBanner({ type: "error", text: e.message }));
    loadPayouts();
  }, [wallet?.id]);

  const checkName = async () => {
    if (!/^\d{10}$/.test(accountNumber) || !bankCode) return;
    setChecking(true);
    setBanner(null);
    try {
      const r = await edgeCall("validate-account", {
        action: "validate",
        accountNumber,
        bankCode,
      });
      setResolvedName(r.account?.accountName ?? "");
    } catch (e) {
      setBanner({ type: "error", text: e.message });
      setResolvedName("");
    } finally {
      setChecking(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!wallet || !value || value <= 0 || !/^\d{10}$/.test(accountNumber) || !bankCode) {
      setBanner({ type: "error", text: "Fill in your bank, account number and a valid amount." });
      return;
    }
    if (value > Number(wallet.balance)) {
      setBanner({ type: "error", text: "Amount exceeds available balance." });
      return;
    }
    if (householdControls.require_approval && householdControls.approval_threshold > 0) {
      const dayLimit = Number(householdControls.approval_threshold);
      if (todaySpent + value > dayLimit) {
        setBanner({
          type: "error",
          text: `Exceeds daily limit of ${naira(dayLimit)}. You've already withdrawn ${naira(todaySpent)} today.`,
        });
        return;
      }
    }
    setLoading(true);
    setBanner(null);
    try {
      const bank = banks.find((b) => b.code === bankCode);
      await edgeCall("withdraw", {
        amount: value,
        accountNumber,
        bankCode,
        bankName: bank?.name ?? "",
      });
      setBanner({ type: "success", text: "Request submitted. Your parent will approve it — funds land in your bank shortly after." });
      setAmount("");
      setResolvedName("");
      loadPayouts();
    } catch (err) {
      setBanner({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!parentLinked) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-slate-500">You need to be linked to a parent to make withdrawals.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <h3 className="font-semibold text-slate-900">Withdraw to your bank account</h3>
        <p className="mt-1 text-sm text-slate-500">
          Money leaves {parentName}'s wallet — your parent will approve before funds are sent.
        </p>

        {banner && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
              banner.type === "success" ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"
            }`}
          >
            {banner.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            {banner.text}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Bank</label>
              <select
                value={bankCode}
                onChange={(e) => { setBankCode(e.target.value); setResolvedName(""); }}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                <option value="">Select bank…</option>
                {banks.map((b) => (
                  <option key={b.code} value={b.code}>{b.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Account number</label>
              <div className="flex gap-2">
                <input
                  value={accountNumber}
                  onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); setResolvedName(""); }}
                  placeholder="0123456789"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={checkName}
                  disabled={checking}
                  className="shrink-0 rounded-lg border border-brand-200 px-3 py-2.5 text-xs font-semibold text-brand-700 disabled:opacity-50"
                >
                  {checking ? "…" : "Verify"}
                </button>
              </div>
              {resolvedName && (
                <p className="mt-1 text-xs font-medium text-mint-600">{resolvedName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Amount (₦)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
            <p className="mt-2 text-xs text-slate-400">
              Available: <span className="font-semibold text-slate-600">{naira(Number(wallet?.balance ?? 0))}</span>
              {householdControls.require_approval && householdControls.approval_threshold > 0 && (
                <>
                  {" · "}Daily limit:{" "}
                  <span className="font-semibold text-slate-600">
                    {naira(Math.max(Number(householdControls.approval_threshold) - todaySpent, 0))}
                  </span>
                </>
              )}
            </p>
          </div>

          <LoadingButton loading={loading}>Request Withdrawal</LoadingButton>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-slate-900">Recent requests</h3>
        {payouts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No withdrawal requests yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {payouts.map((p) => {
              const s = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.pending_otp;
              return (
                <div key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Send size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{naira(p.amount)}</p>
                    <p className="truncate text-xs text-slate-400">
                      {p.bank_name || "Bank"} · {p.account_number}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cls}`}>{s.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
