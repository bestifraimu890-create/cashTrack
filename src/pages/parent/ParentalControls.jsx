import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../supabase/client.js";
import { Toggle, Card } from "../../components/common/index.js";

export default function ParentalControls() {
  const { childrenList } = useOutletContext();
  const [selected, setSelected] = useState(childrenList[0]?.id ?? "");
  const [requireApproval, setRequireApproval] = useState(false);
  const [approvalThreshold, setApprovalThreshold] = useState(5000);
  const [notifyOnEveryTransaction, setNotifyOnEveryTransaction] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [householdId, setHouseholdId] = useState(null);

  const child = childrenList.find((c) => c.id === selected);

  useEffect(() => {
    if (!selected) return;
    setLoading(true);
    setFeedback(null);
    supabase
      .from("households")
      .select("id, require_approval, approval_threshold, notify_on_every_transaction")
      .eq("child_id", selected)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setHouseholdId(data.id);
          setRequireApproval(data.require_approval ?? false);
          setApprovalThreshold(Number(data.approval_threshold ?? 0));
          setNotifyOnEveryTransaction(data.notify_on_every_transaction ?? false);
        }
        setLoading(false);
      });
  }, [selected]);

  const handleSave = async () => {
    if (!householdId) return;
    setSaving(true);
    setFeedback(null);
    const { error } = await supabase
      .from("households")
      .update({
        require_approval: requireApproval,
        approval_threshold: approvalThreshold,
        notify_on_every_transaction: notifyOnEveryTransaction,
      })
      .eq("id", householdId);
    if (error) {
      setFeedback({ type: "error", msg: error.message });
    } else {
      setFeedback({ type: "success", msg: "Settings saved." });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {childrenList.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium ${
              selected === c.id ? "bg-brand-700 text-white" : "bg-white text-slate-500 border border-slate-200"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {childrenList.length === 0 && (
        <Card className="p-10 text-center text-sm text-slate-400">
          No children linked yet. Link a child to manage their parental controls.
        </Card>
      )}

      {child && !loading && (
        <Card className="divide-y divide-slate-100">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-800">Require approval for purchases</p>
              <p className="text-xs text-slate-400">
                {child.name} must get your approval before spending above the threshold
              </p>
            </div>
            <Toggle checked={requireApproval} onChange={setRequireApproval} />
          </div>

          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-800">Approval threshold</p>
              <p className="text-xs text-slate-400">
                {child.name} cannot spend more than this amount in a day without approval
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
              <span className="text-sm text-slate-400">₦</span>
              <input
                type="number"
                min="0"
                value={approvalThreshold}
                onChange={(e) => setApprovalThreshold(parseFloat(e.target.value) || 0)}
                className="w-24 bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm font-medium text-slate-800">Notify on every transaction</p>
              <p className="text-xs text-slate-400">
                Get an alert for each purchase, not just limit breaches
              </p>
            </div>
            <Toggle checked={notifyOnEveryTransaction} onChange={setNotifyOnEveryTransaction} />
          </div>

          <div className="p-5">
            {feedback && (
              <div
                className={`mb-3 rounded-lg px-4 py-3 text-sm ${
                  feedback.type === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-mint-50 text-mint-700"
                }`}
              >
                {feedback.msg}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
