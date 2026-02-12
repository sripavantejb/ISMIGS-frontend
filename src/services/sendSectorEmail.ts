import { supabase } from "@/integrations/supabase/client";

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET ?? "";

export async function sendSectorTestEmail(
  sectorKey: string,
  emails?: string[]
): Promise<{ sent: number; results?: { to: string; ok: boolean; error?: string }[] }> {
  const body: { sector_key: string; isTest: boolean; emails?: string[] } = {
    sector_key: sectorKey,
    isTest: true,
  };
  if (emails?.length) body.emails = emails;
  const { data, error } = await supabase.functions.invoke("send-sector-email", {
    body,
    headers: ADMIN_SECRET ? { "x-admin-secret": ADMIN_SECRET } : undefined,
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return { sent: data?.sent ?? 0, results: data?.results };
}
