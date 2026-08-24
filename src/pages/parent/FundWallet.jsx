import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { supabase } from "../../supabase/client.js";
import { edgeCall } from "../../supabase/edge.js";
import { naira } from "../../lib/constants.js";
import { Card } from "../../components/common/index.js";

export default function FundWallet() {
  const { user } = useOutletContext();
  const [wallet, setWallet] = useState(null);
  const [account, setAccount] = useState(null);
  const [amount, setAmount] = useState("");
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [banner, setBanner] = useState(null);
  const [copied, setCopied] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualBank, setManualBank] = useState("");
  const [manualNumber, setManualNumber] = useState("");
  const [manualName, setManualName] = useState("");
  const quickAmounts = [500, 1000, 2000, 5000];

  const load = async () => {
    const { data: w } = await supabase
      .from("wallets")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();
    setWallet(w);
    if (w) {
      const { data: a } = await supabase
        .from("monnify_accounts")
        .select("*")
        .eq("wallet_id", w.id)
        .maybeSingle();
      setAccount(a);
    }
    const { data: links } = await supabase
      .from("households")
      .select("child_id")
      .eq("parent_id", user.id);
    if (links?.length) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name")
        .in("id", links.map((l) => l.child_id));
      setChildren(profiles ?? []);
      setChildId((prev) => prev || profiles?.[0]?.id || "");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const getOrCreateAccount = async () => {
    setLoading(true);
    setBanner(null);
    try {
      const r = await edgeCall("fund-wallet", { action: "reserve" });
      setAccount(r.account);
      setWallet((prev) => prev ?? {});
    } catch (e) {
      if (e.message?.includes("already have a reserved account")) {
        setManualEntry(true);
        setBanner({ type: "error", text: e.message + " You can enter your account details below." });
      } else {
        setBanner({ type: "error", text: e.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveManualAccount = async () => {
    if (!manualNumber.trim() || !manualBank.trim() || !manualName.trim()) {
      setBanner({ type: "error", text: "All fields are required." });
      return;
    }
    setLoading(true);
    setBanner(null);
    try {
      const { error } = await supabase.from("monnify_accounts").insert({
        wallet_id: wallet.id,
        account_name: manualName.trim(),
        account_number: manualNumber.trim(),
        bank_name: manualBank.trim(),
        monnify_reference: `manual-${wallet.id}`,
      });
      if (error) throw error;
      setAccount({
        account_name: manualName.trim(),
        account_number: manualNumber.trim(),
        bank_name: manualBank.trim(),
      });
      setManualEntry(false);
      setBanner({ type: "success", text: "Account details saved." });
    } catch (e) {
      setBanner({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const payByCard = async (e) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!value || value <= 0) {
      setBanner({ type: "error", text: "Enter a valid amount." });
      return;
    }
    setLoading(true);
    setBanner(null);
    try {
      const r = await edgeCall("fund-wallet", { action: "checkout", amount: value });
      window.open(r.checkoutUrl, "_blank");
      setBanner({ type: "success", text: "Payment page opened. Your wallet is credited automatically once payment completes." });
      setAmount("");
      setTimeout(load, 2000);
    } catch (err) {
      setBanner({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const sendToChild = async (e) => {
    e.preventDefault();
    const value = parseFloat(sendAmount);
    if (!childId || !value || value <= 0) {
      setBanner({ type: "error", text: "Choose a child and enter a valid amount." });
      return;
    }
    setSending(true);
    setBanner(null);
    try {
      await edgeCall("send-to-child", { childId, amount: value, note });
      setBanner({ type: "success", text: `${naira(value)} sent to your child's wallet.` });
      setSendAmount("");
      setNote("");
      setTimeout(load, 500);
    } catch (err) {
      setBanner({ type: "error", text: err.message });
    } finally {
      setSending(false);
    }
  };

  const copyNumber = () => {
    if (!account) return;
    navigator.clipboard.writeText(account.account_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-5">
      {banner && (
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
            banner.type === "success" ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"
          }`}
        >
          {banner.type === "success" ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {banner.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-900">Your wallet</h3>
              <p className="mt-1 text-sm text-slate-500">
                Fund it by transfer or card, then send money to your children's wallets.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{naira(Number(wallet?.balance ?? 0))}</p>
              <p className="text-xs text-slate-400">Available balance</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
              Transfer to this account (free, instant)
            </p>
            {account ? (
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-2xl font-bold tracking-widest text-slate-900">{account.account_number}</p>
                  <p className="text-xs text-slate-500">
                    {account.account_name} · {account.bank_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyNumber}
                  className="rounded-lg bg-brand-700 px-3 py-2 text-xs font-semibold text-white"
                >
                  {copied ? "Copied!" : "Copy number"}
                </button>
              </div>
            ) : manualEntry ? (
              <div className="mt-3 space-y-3">
                <p className="text-xs font-semibold text-slate-600">Enter your Monnify reserved account details:</p>
                <input
                  value={manualNumber}
                  onChange={(e) => setManualNumber(e.target.value)}
                  placeholder="Account number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <input
                  value={manualBank}
                  onChange={(e) => setManualBank(e.target.value)}
                  placeholder="Bank name (e.g. Moniepoint, Wema)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Account name"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveManualAccount}
                    disabled={loading}
                    className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {loading ? "Saving…" : "Save Account"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualEntry(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={getOrCreateAccount}
                disabled={loading}
                className="mt-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Creating…" : "Get my dedicated account number"}
              </button>
            )}
          </div>

          <form onSubmit={payByCard} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">
                Or pay by card / USSD (credited instantly)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {quickAmounts.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAmount(String(a))}
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 hover:border-brand-400 hover:text-brand-700"
                  >
                    {naira(a)}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Starting payment…" : "Pay by Card"}
            </button>
          </form>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-slate-900">Send to a child</h3>
          <p className="mt-1 text-sm text-slate-500">
            Moves money from your wallet into your child's wallet. They can then withdraw to their bank within your limits.
          </p>
          <form onSubmit={sendToChild} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Child</label>
              <select
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                {children.length === 0 && <option value="">No children linked yet</option>}
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Amount (₦)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sendAmount}
                onChange={(e) => setSendAmount(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Note (optional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Weekly allowance"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              disabled={sending || children.length === 0}
              className="w-full rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send Funds"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
