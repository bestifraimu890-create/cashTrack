const g = globalThis as unknown as {
  __mnToken?: string;
  __mnTokenExp?: number;
};

export const MONNIFY_BASE =
  Deno.env.get("MONNIFY_BASE_URL") ?? "https://sandbox.monnify.com";

/** Exchange API key + secret for a Bearer token (cached ~29 min). */
export async function monnifyToken(): Promise<string> {
  if (g.__mnToken && g.__mnTokenExp && g.__mnTokenExp > Date.now() / 1000) {
    return g.__mnToken;
  }
  const apiKey = Deno.env.get("MONNIFY_API_KEY");
  const secret = Deno.env.get("MONNIFY_SECRET_KEY");
  if (!apiKey || !secret) {
    throw new Error("MONNIFY_API_KEY / MONNIFY_SECRET_KEY secrets not configured");
  }
  const res = await fetch(`${MONNIFY_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${apiKey}:${secret}`)}`,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!data.requestSuccessful) {
    throw new Error(data.responseMessage ?? "Monnify auth failed");
  }
  g.__mnToken = data.responseBody.accessToken;
  g.__mnTokenExp =
    Date.now() / 1000 + (data.responseBody.expiresIn ?? 1800) - 60;
  return g.__mnToken!;
}

/** Authenticated Monnify API call. Throws with Monnify's message on failure. */
export async function monnifyApi(
  path: string,
  init: RequestInit = {},
): Promise<any> {
  const token = await monnifyToken();
  const res = await fetch(`${MONNIFY_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    // non-JSON response
  }
  if (!data.requestSuccessful) {
    throw new Error(
      data.responseMessage ?? `Monnify ${path} failed (HTTP ${res.status})`,
    );
  }
  return data;
}

export function getContractCode(): string {
  const c = Deno.env.get("MONNIFY_CONTRACT_CODE");
  if (!c) throw new Error("MONNIFY_CONTRACT_CODE secret not configured");
  return c;
}

export function getSourceAccount(): string {
  const a = Deno.env.get("MONNIFY_SOURCE_ACCOUNT");
  if (!a) throw new Error("MONNIFY_SOURCE_ACCOUNT secret not configured");
  return a;
}