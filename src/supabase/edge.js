import { supabase } from "./client.js";

export const EDGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export async function edgeCall(fn, body = {}, opts = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const res = await fetch(`${EDGE_BASE}/${fn}`, {
    method: opts.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? ""}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}