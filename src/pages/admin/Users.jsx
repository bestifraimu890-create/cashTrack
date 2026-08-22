import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Search } from "lucide-react";
import { Card, StatusBadge } from "../../components/common/index.js";

export default function Users() {
  const { users, toggleUserStatus } = useOutletContext();
  const [roleFilter, setRoleFilter] = useState("All");
  const [query, setQuery] = useState("");
  const filters = ["All", "Student", "Parent", "Admin"];

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === "All" || u.role === roleFilter;
    const matchesQuery =
      (u.name || "").toLowerCase().includes(query.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(query.toLowerCase());
    return matchesRole && matchesQuery;
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:w-72">
          <Search size={16} className="text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setRoleFilter(f)}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                roleFilter === f ? "bg-brand-700 text-white" : "bg-white text-slate-500 border border-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-400">
              <th className="px-5 py-3 font-semibold">User</th>
              <th className="px-5 py-3 font-semibold">Role</th>
              <th className="px-5 py-3 font-semibold">Joined</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3.5">
                  <p className="font-medium text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{u.role}</td>
                <td className="px-5 py-3.5 text-slate-500">{u.joined}</td>
                <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => toggleUserStatus(u.id)}
                    className="text-xs font-semibold text-brand-700 hover:underline"
                  >
                    {u.status === "active" ? "Suspend" : "Reactivate"}
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                  {users.length === 0 ? "No users have signed up yet." : "No users match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
