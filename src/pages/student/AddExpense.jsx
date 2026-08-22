import React, { useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { PlusCircle, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { naira, CATEGORIES } from "../../lib/constants.js";
import { Card, LoadingButton } from "../../components/common/index.js";

export default function AddExpense() {
  const { addExpense, addMany } = useOutletContext();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [banner, setBanner] = useState(null);
  const fileRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!merchant.trim() || !value || value <= 0) {
      setBanner({ type: "error", text: "Enter a merchant name and a valid amount." });
      return;
    }
    await addExpense({ merchant: merchant.trim(), category, amount: -Math.abs(value), note });
    setBanner({ type: "success", text: `Expense of ${naira(value)} added to ${category}.` });
    setAmount("");
    setMerchant("");
    setNote("");
  };

  const handleCsv = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const lines = text.split(/\r?\n/).filter(Boolean);
      const rows = lines[0]?.toLowerCase().includes("merchant") ? lines.slice(1) : lines;
      const parsed = rows
        .map((line) => {
          const [date, merchantName, cat, amt] = line.split(",").map((s) => s?.trim());
          const value = parseFloat(amt);
          if (!merchantName || !value) return null;
          return {
            merchant: merchantName,
            category: CATEGORIES[cat] ? cat : "Other",
            amount: -Math.abs(value),
            date: date || "Imported",
            time: "",
          };
        })
        .filter(Boolean);
      if (parsed.length) {
        addMany(parsed);
        setBanner({ type: "success", text: `Imported ${parsed.length} expense(s) from CSV.` });
      } else {
        setBanner({ type: "error", text: "Couldn't read that file. Use columns: date,merchant,category,amount." });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <h3 className="font-semibold text-slate-900">Log a new expense</h3>
        <p className="mt-1 text-sm text-slate-500">Manual entries appear in your transactions right away.</p>

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
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Merchant / Description</label>
            <input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. School Tuck Shop"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              >
                {Object.keys(CATEGORIES).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Add a note..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <LoadingButton loading={false}>Add Expense</LoadingButton>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-slate-900">Import from CSV</h3>
        <p className="mt-1 text-sm text-slate-500">
          Columns: <span className="font-mono text-xs">date, merchant, category, amount</span>
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-8 text-slate-400 hover:border-brand-400 hover:text-brand-600"
        >
          <Upload size={22} />
          <span className="text-sm font-medium">Click to upload .csv</span>
        </button>
        <input ref={fileRef} type="file" accept=".csv" onChange={handleCsv} className="hidden" />
      </Card>
    </div>
  );
}
