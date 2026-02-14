import { useState, useEffect, useCallback } from "react";
import { getFarmProfile, saveFarmProfile } from "../services/farmProfileApi";
import type { FarmProfile } from "../types";

export function useFarmProfile() {
  const [profile, setProfile] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = await getFarmProfile();
      setProfile(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (data: FarmProfile) => {
      setError(null);
      try {
        const saved = await saveFarmProfile(data);
        setProfile(saved);
        return saved;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save profile");
        throw e;
      }
    },
    []
  );

  return { profile, loading, error, save, reload: load };
}
