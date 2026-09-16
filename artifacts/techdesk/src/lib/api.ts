// -----------------------------------------------------------------------------
// TechDesk AI — browser API client
// -----------------------------------------------------------------------------
// A small typed fetch wrapper. The access token is stored in localStorage (a
// deliberately weak, XSS-exfiltratable location — matching how many real SPAs
// hold JWTs) and attached as a Bearer header on every request.
// -----------------------------------------------------------------------------

const TOKEN_KEY = 'td_access_token';
const REFRESH_KEY = 'td_refresh_token';

export const tokenStore = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set: (t: string | null) => { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } },
  getRefresh: () => { try { return localStorage.getItem(REFRESH_KEY); } catch { return null; } },
  setRefresh: (t: string | null) => { try { t ? localStorage.setItem(REFRESH_KEY, t) : localStorage.removeItem(REFRESH_KEY); } catch { /* ignore */ } },
  clear: () => { tokenStore.set(null); tokenStore.setRefresh(null); },
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('accept', 'application/json');
  if (options.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const token = tokenStore.get();
  if (token && !headers.has('authorization')) headers.set('authorization', `Bearer ${token}`);

  const res = await fetch(`/api${path}`, { ...options, headers });
  const text = await res.text();
  let data: unknown = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) {
    const msg = (data && typeof data === 'object' && 'error' in data) ? String((data as Record<string, unknown>).error) : `HTTP ${res.status}`;
    throw new ApiError(res.status, msg, data);
  }
  return data as T;
}

export const post = <T = unknown>(path: string, body?: unknown) =>
  api<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
export const patch = <T = unknown>(path: string, body?: unknown) =>
  api<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) });
export const get = <T = unknown>(path: string) => api<T>(path);

// ------------------------------- Types ---------------------------------------
export interface Organization { id: number; name: string; plan?: string; }
export interface SessionUser {
  id: number; name: string; email: string; role: string; tenantId: number;
  status: string; initials: string; lastActive?: string; organization?: Organization;
  apiKey?: string; mfaSecret?: string; password?: string; passwordHash?: string;
}
export interface Session {
  user: SessionUser; organization?: Organization; role: string; tenantId: number;
  via: string; labMode: string; debugEnabled: boolean;
}
export interface LoginResult {
  user: SessionUser; organization?: Organization; accessToken: string; refreshToken: string;
  labMode: string; secretHint?: string;
}
export interface DocumentRow {
  id: number; tenantId?: number; title: string; type: string; status: string;
  chunks: number; updatedAt: string; author: string; preview: string;
  sensitivity: string; organization?: string; content?: string;
}
export interface SearchResult {
  id: number; title: string; excerpt: string; type: string; score: number;
  organization?: string; tenantId?: number; matchedTerms: string[];
}
export interface ChatResponse {
  id: number; answer: string; format: 'text' | 'html';
  citations: Array<{ documentId: number; title: string; snippet: string; tenantId?: number }>;
  model: string; safety: string;
}
export interface AgentTool { name: string; description: string; category: string; risk: string; }
export interface AgentRun {
  id: number; summary: string; steps: string[]; toolsUsed: string[]; status: string; observation: string;
}
export interface Ticket {
  id: number; tenantId?: number; subject: string; status: string; priority: string;
  requester: string; updatedAt: string; assignee?: string;
}
export interface Exercise {
  id: string; title: string; category: 'LLM/AI' | 'API' | 'Web' | 'Auth';
  owasp: string[]; severity: 'Low' | 'Medium' | 'High' | 'Critical';
  endpoint: string; summary: string; repro: string; cve?: string;
}
