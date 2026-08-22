import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { edgeCall } from "../../supabase/edge.js";
import { Card, ChildAvatar } from "../../components/common/index.js";

export default function SpendingLimits() {
  const { user } = useOutletContext();
  const [kids, setKids] = useState([]);
  const [banner, setBanner] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    const { data: links } = await supabase
      .from("households")
      .select("child_id")
      .eq("parent_id", user.id);
    if (!links?.length) return;
    const ids = links.map((l) => l.child_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, school")
      .in("id", ids);
    const { data: wallets } = await supabase
      .from("wallets")
      .select("owner_id, weekly_limit, monthly_limit, status")
      .in("owner_id", ids);
    setKids(
      (profiles ?? []).map((p) => {
        const w = (wallets ?? []).find((x) => x.owner_id === p.id);
        return {
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          school: p.school,
          weeklyLimit: Number(w?.weekly_limit ?? 5000),
          monthlyLimit: Number(w?.monthly_limit ?? 18000),
          status: w?.status ?? "active",
        };
      }),
    );
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (id, field, value) => {
    const num = parseFloat(value);
    if (Number.isNaN(num) || num <= 0) return;
    setSavingId(id);
    setBanner(null);
    try {
      await edgeCall("update-child-limits", {
        childId: id,
        ...(field === "weeklyLimit" ? { weeklyLimit: num } : { monthlyLimit: num }),
      });
      setBanner(`${field === "weeklyLimit" ? "Weekly" : "Monthly"} limit updated.`);
      load();
    } catch (e) {
      setBanner(`Could not save: ${e.message}`);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {banner && (
        <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          <CheckCircle2 size={16} /> {banner}
        </div>
      )}
      {kids.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-400">
          No children linked yet. Link a child to set their withdrawal limits.
        </Card>
      )}
      {kids.map((c) => (
        <Card key={c.id} className="p-6">
          <div className="mb-4 flex items-center gap-3">
            <ChildAvatar child={c} />
            <div>
              <p className="font-semibold text-slate-900">{c.name}</p>
              <p className="text-xs text-slate-400">{c.school || "Student"}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { key: "weeklyLimit", label: "Weekly Withdrawal Limit" },
              { key: "monthlyLimit", label: "Monthly Withdrawal Limit" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-semibold text-slate-500">{label}</label>
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                  <span className="text-sm text-slate-400">₦</span>
                  <input
                    type="number"
                    min="0"
                    defaultValue={c[key]}
                    disabled={savingId === c.id}
                    onBlur={(e) => handleSave(c.id, key, e.target.value)}
                    className="w-full bg-transparent text-sm outline-none disabled:opacity-50"
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
