/**
 * Backend API base URL. When VITE_API_URL is unset or empty, uses the deployed backend.
 * Use this for all API calls so dev and prod use the same deployed URL (no localhost).
 */
export const API_BASE =
  (import.meta.env.VITE_API_URL || "").trim() || "https://ismigs-backend.vercel.app";
