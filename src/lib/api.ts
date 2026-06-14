// Typed API client. The browser talks to NEXT_PUBLIC_API_BASE_URL (same-origin /api via nginx),
// so the SAME code works against either backend. Handles JWT attach + one refresh retry on 401.

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

const ACCESS_KEY = "sm_access";
const REFRESH_KEY = "sm_refresh";

export const tokenStore = {
  get access() {
    return typeof window !== "undefined" ? localStorage.getItem(ACCESS_KEY) : null;
  },
  get refresh() {
    return typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null;
  },
  set(access: string, refresh?: string) {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  code: string;
  status: number;
  fields?: Record<string, string>;
  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

type Options = { auth?: boolean; method?: string; body?: unknown };

async function raw(path: string, { auth = true, method = "GET", body }: Options): Promise<Response> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && tokenStore.access) headers["Authorization"] = `Bearer ${tokenStore.access}`;
  return fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function refreshAccess(): Promise<boolean> {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;
  const res = await raw("/auth/refresh", { auth: false, method: "POST", body: { refresh } });
  if (!res.ok) return false;
  const data = await res.json();
  tokenStore.set(data.access);
  return true;
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(res.status, err.code ?? "error", err.message ?? "Request failed", err.fields);
  }
  return data as T;
}

export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  let res = await raw(path, opts);
  if (res.status === 401 && (opts.auth ?? true) && tokenStore.refresh) {
    if (await refreshAccess()) {
      res = await raw(path, opts);
    }
  }
  return parse<T>(res);
}

// Convenience verbs
export const apiGet = <T>(p: string, auth = true) => api<T>(p, { method: "GET", auth });
export const apiPost = <T>(p: string, body?: unknown, auth = true) =>
  api<T>(p, { method: "POST", body, auth });
export const apiDelete = <T>(p: string, auth = true) => api<T>(p, { method: "DELETE", auth });

export const BACKEND_LABEL = process.env.NEXT_PUBLIC_BACKEND_LABEL || "API";
