/**
 * CIM-RMS API fetch client for orval
 * Matches orval v8 generated call signature: client<T>(url, options)
 * Adds JWT Bearer token from localStorage automatically.
 */

type OrvalOptions = RequestInit & {
  baseUrl?: string;
  url?: string;        // backward compat (old orval v7 style)
  params?: Record<string, string | number | boolean>;
};

const DEFAULT_BASE = 'http://localhost:3001/v1';

function readTokenFromAuthStore(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem('mrdi-auth');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed.state?.token ?? undefined;
  } catch {
    return undefined;
  }
}

export const cimrmsApiClient = async <T>(
  url: string,
  options: OrvalOptions = {},
): Promise<T> => {
  const token = readTokenFromAuthStore();

  const { baseUrl, url: _legacyUrl, params, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers as Record<string, string> | undefined ?? {}),
  };

  const base = baseUrl ?? DEFAULT_BASE;
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
          acc[k] = String(v);
          return acc;
        }, {})
      ).toString()
    : '';
  const fullUrl = `${base}${url}${qs}`;

  const res = await fetch(fullUrl, { ...rest, headers });

  if (!res.ok) {
    let errorBody: unknown;
    try { errorBody = await res.json(); } catch { errorBody = await res.text(); }
    throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status, data: errorBody });
  }

  return (await res.json()) as T;
};
