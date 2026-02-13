/**
 * Admin backend API client. Backend URL is VITE_API_URL (e.g. https://ismigs-backend.vercel.app).
 * When unset, uses the deployed backend in all environments. Set VITE_API_URL in .env to override (e.g. local backend).
 * Auth: Bearer token from localStorage (set after POST /api/auth/login).
 */

const API_BASE =
  import.meta.env.VITE_API_URL || "https://ismigs-backend.vercel.app";
const TOKEN_KEY = "ismigs_admin_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const token = getStoredToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, { ...options, headers: { ...getHeaders(), ...options.headers } });
  if (res.status === 401) clearStoredToken();
  return res;
}

export type SectorRecipientRow = {
  sector_key: string;
  display_name: string;
  emails: string[];
  updated_at: string;
  label?: string | null;
  enabled?: boolean;
  cc?: string[];
  bcc?: string[];
};

export type EmailLogRow = {
  id: string;
  sector_key: string;
  recipient: string;
  subject: string;
  sent_at: string;
  success: boolean;
  error_message: string | null;
};

export type AdminSettings = {
  notifications_enabled: boolean;
  default_from: string | null;
};

export async function login(username: string, password: string): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error ?? "Login failed") as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function fetchMe(): Promise<{ user: string }> {
  const res = await apiFetch(`${API_BASE}/api/auth/me`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Unauthorized");
  }
  return res.json();
}

export async function fetchSectorRecipients(): Promise<Record<string, SectorRecipientRow>> {
  const res = await apiFetch(`${API_BASE}/api/sector-recipients`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Failed to fetch sector recipients");
  }
  return res.json();
}

export async function upsertSectorRecipient(params: {
  sector_key: string;
  display_name: string;
  emails: string[];
  label?: string | null;
  enabled?: boolean;
  cc?: string[];
  bcc?: string[];
}): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/sector-recipients`, {
    method: "PUT",
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Failed to save");
  }
}

export async function sendSectorTestEmail(
  sectorKey: string,
  emails?: string[],
  options?: { insights?: string[]; warnings?: string[] }
): Promise<{ sent: number; results?: { to: string; ok: boolean; error?: string }[] }> {
  const body: { sector_key: string; isTest: boolean; emails?: string[]; insights?: string[]; warnings?: string[] } = {
    sector_key: sectorKey,
    isTest: true,
  };
  if (emails?.length) body.emails = emails;
  if (options?.insights?.length) body.insights = options.insights;
  if (options?.warnings?.length) body.warnings = options.warnings;
  const res = await apiFetch(`${API_BASE}/api/send-sector-email`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Failed to send test email");
  return { sent: data.sent ?? 0, results: data.results };
}

export async function sendTestToAllSectors(options?: {
  insights?: string[];
  warnings?: string[];
}): Promise<{
  sent: number;
  failed: number;
  results: { sector_key: string; sent: number; failed: number }[];
}> {
  const body: { sector_key: string; isTest: boolean; insights?: string[]; warnings?: string[] } = {
    sector_key: "all",
    isTest: true,
  };
  if (options?.insights?.length) body.insights = options.insights;
  if (options?.warnings?.length) body.warnings = options.warnings;
  const res = await apiFetch(`${API_BASE}/api/send-sector-email`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Failed to send test to all");
  return {
    sent: data.sent ?? 0,
    failed: data.failed ?? 0,
    results: data.results ?? [],
  };
}

export async function fetchEmailLogs(params?: {
  limit?: number;
  offset?: number;
  sector_key?: string;
}): Promise<EmailLogRow[]> {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.sector_key) q.set("sector_key", params.sector_key);
  const url = `${API_BASE}/api/email-logs${q.toString() ? `?${q}` : ""}`;
  const res = await apiFetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Failed to fetch email logs");
  }
  return res.json();
}

export async function fetchSettings(): Promise<AdminSettings> {
  const res = await apiFetch(`${API_BASE}/api/settings`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Failed to fetch settings");
  }
  return res.json();
}

export async function updateSettings(patch: {
  notifications_enabled?: boolean;
  default_from?: string | null;
}): Promise<AdminSettings> {
  const res = await apiFetch(`${API_BASE}/api/settings`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Failed to update settings");
  }
  return res.json();
}

export async function smtpTest(to: string): Promise<{ dev?: boolean; previewUrl?: string | null }> {
  const res = await apiFetch(`${API_BASE}/api/settings/smtp-test`, {
    method: "POST",
    body: JSON.stringify({ to }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "SMTP test failed");
  }
  const data = await res.json().catch(() => ({}));
  return { dev: data.dev, previewUrl: data.previewUrl ?? null };
}

export async function exportSectorRecipientsCsv(): Promise<Blob> {
  const res = await apiFetch(`${API_BASE}/api/sector-recipients/export`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Failed to export");
  }
  return res.blob();
}

export async function importSectorRecipientsCsv(
  rows: { sector_key: string; display_name: string; emails: string[] }[]
): Promise<{ ok: number; err: number; total: number }> {
  const res = await apiFetch(`${API_BASE}/api/sector-recipients/import`, {
    method: "POST",
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Failed to import");
  }
  return res.json();
}

export async function importSectorRecipientsCsvFile(csvText: string): Promise<{ ok: number; err: number; total: number }> {
  const res = await apiFetch(`${API_BASE}/api/sector-recipients/import`, {
    method: "POST",
    body: JSON.stringify({ csv: csvText }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Failed to import");
  }
  return res.json();
}
