/**
 * Farm profile API. Uses backend when available; falls back to localStorage for MVP.
 */
import { API_BASE } from "@/config/api";
import type { FarmProfile } from "../types";

const STORAGE_KEY = "ismigs-farm-profile";

export async function getFarmProfile(): Promise<FarmProfile | null> {
  try {
    const token = localStorage.getItem("ismigs-farmer-token");
    if (token) {
      const res = await fetch(`${API_BASE}/api/farmers/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        return data.profile ?? data;
      }
    }
  } catch {
    // ignore
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FarmProfile;
  } catch {
    return null;
  }
}

export async function saveFarmProfile(profile: FarmProfile): Promise<FarmProfile> {
  try {
    const token = localStorage.getItem("ismigs-farmer-token");
    if (token) {
      const res = await fetch(`${API_BASE}/api/farmers/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
      });
      if (res.ok) {
        const data = await res.json();
        return data.profile ?? data;
      }
    }
  } catch {
    // ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  return profile;
}
