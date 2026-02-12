import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-secret",
};

interface RequestBody {
  sector_key?: string;
  emails?: string[];
  subject?: string;
  body?: string;
  isTest?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const adminSecret = req.headers.get("x-admin-secret");
  const expectedSecret = Deno.env.get("ADMIN_SECRET");
  if (expectedSecret && adminSecret !== expectedSecret) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = (await req.json().catch(() => ({}))) as RequestBody;
    const { sector_key, emails: bodyEmails, subject, body: bodyText, isTest = true } = body;

    let emails: string[] = bodyEmails ?? [];
    let displayName = "";

    if (sector_key && emails.length === 0) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
      const supabase = createClient(supabaseUrl, supabaseKey!);
      const { data, error } = await supabase
        .from("sector_recipients")
        .select("emails, display_name")
        .eq("sector_key", sector_key)
        .single();
      if (error || !data) {
        return new Response(
          JSON.stringify({ error: "Sector not found or has no recipients" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      emails = (data.emails as string[]) ?? [];
      displayName = (data.display_name as string) ?? sector_key;
    } else if (bodyEmails?.length) {
      displayName = sector_key ?? "Sector";
    }

    if (!emails.length) {
      return new Response(
        JSON.stringify({ error: "No email addresses to send to" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const finalSubject = subject ?? (isTest ? `ISMIGS – Test notification for ${displayName || sector_key}` : `ISMIGS – Update for ${displayName || sector_key}`);
    const finalBody = bodyText ?? (isTest
      ? `This is a test email from ISMIGS. You are receiving this because you are subscribed to sector: ${displayName || sector_key}.`
      : `Update for sector: ${displayName || sector_key}.`);

    // Option A: Resend (HTTP)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const from = Deno.env.get("RESEND_FROM") ?? "ISMIGS <onboarding@resend.dev>";
      const results: { to: string; ok: boolean; error?: string }[] = [];
      for (const to of emails) {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [to],
            subject: finalSubject,
            text: finalBody,
          }),
        });
        const data = await res.json().catch(() => ({}));
        results.push({
          to,
          ok: res.ok,
          error: res.ok ? undefined : (data.message || data.error || res.statusText),
        });
      }
      return new Response(
        JSON.stringify({ sent: results.filter((r) => r.ok).length, results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Option B: SMTP via Deno (denomailer) – optional, require SMTP env vars
    const smtpHost = Deno.env.get("SMTP_HOST");
    if (smtpHost) {
      const port = parseInt(Deno.env.get("SMTP_PORT") ?? "587", 10);
      const user = Deno.env.get("SMTP_USER");
      const pass = Deno.env.get("SMTP_PASSWORD");
      if (!user || !pass) {
        return new Response(
          JSON.stringify({ error: "SMTP_USER and SMTP_PASSWORD required for SMTP" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      try {
        const { SMTPClient } = await import("https://deno.land/x/denomailer@1.6.0/mod.ts");
        const client = new SMTPClient({
          connection: {
            hostname: smtpHost,
            port,
            tls: port === 465,
            auth: { username: user, password: pass },
          },
        });
        const results: { to: string; ok: boolean; error?: string }[] = [];
        const fromAddr = Deno.env.get("SMTP_FROM") ?? user;
        const htmlBody = finalBody.replace(/\n/g, "<br>");
        for (const to of emails) {
          try {
            await client.send({
              from: fromAddr,
              to,
              subject: finalSubject,
              content: finalBody,
              html: htmlBody,
            });
            results.push({ to, ok: true });
          } catch (e) {
            results.push({ to, ok: false, error: e instanceof Error ? e.message : String(e) });
          }
        }
        await client.close();
        return new Response(
          JSON.stringify({ sent: results.filter((r) => r.ok).length, results }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (importErr) {
        console.error("SMTP send error:", importErr);
        return new Response(
          JSON.stringify({ error: "SMTP not configured or denomailer failed. Set RESEND_API_KEY or SMTP_*." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "No email provider configured. Set RESEND_API_KEY or SMTP_HOST." }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-sector-email error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
