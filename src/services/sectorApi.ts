/**
 * Sector panel API: login and LinkedIn approval decisions.
 * Uses separate token from admin (ismigs_sector_token).
 */
import { API_BASE } from "@/config/api";

const SECTOR_TOKEN_KEY = "ismigs_sector_token";

export function getStoredSectorToken(): string | null {
  return localStorage.getItem(SECTOR_TOKEN_KEY);
}

export function setStoredSectorToken(token: string): void {
  localStorage.setItem(SECTOR_TOKEN_KEY, token);
}

export function clearStoredSectorToken(): void {
  localStorage.removeItem(SECTOR_TOKEN_KEY);
}

function getSectorHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const token = getStoredSectorToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function sectorLogin(username: string, password: string): Promise<{ token: string; sector_key: string }> {
  const res = await fetch(`${API_BASE}/api/auth/sector-login`, {
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
  return { token: data.token, sector_key: data.sector_key };
}

export type SectorDecisionRow = {
  id: string;
  token: string;
  commodity: string | null;
  linkedin_post_text: string | null;
  hashtags: string[];
  status: string;
  created_at: string | null;
  expires_at: string | null;
  responded_at: string | null;
  production?: number | null;
  consumption?: number | null;
  import_dependency?: number | null;
  risk_score?: number | null;
  projected_deficit_year?: string | null;
  sector_impact?: string | null;
};

export type SectorDecisionsResponse = {
  items: SectorDecisionRow[];
};

export async function fetchSectorDecisions(params?: {
  status?: string;
  limit?: number;
}): Promise<SectorDecisionsResponse> {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.limit != null) q.set("limit", String(params.limit));
  const url = `${API_BASE}/api/sector/decisions${q.toString() ? `?${q}` : ""}`;
  const res = await fetch(url, { headers: getSectorHeaders() });
  if (res.status === 401) clearStoredSectorToken();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Failed to fetch decisions");
  return data;
}

export async function respondToDecision(
  decisionId: string,
  action: "approve" | "reject"
): Promise<{ ok: boolean; status: string }> {
  const res = await fetch(`${API_BASE}/api/sector/decision/${decisionId}/respond`, {
    method: "POST",
    headers: getSectorHeaders(),
    body: JSON.stringify({ action }),
  });
  if (res.status === 401) clearStoredSectorToken();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Failed to respond");
  return data;
}
