import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { stateData, alerts, forecasts, labourType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are an expert Indian macroeconomic analyst specializing in Consumer Price Index data for Agricultural and Rural Labourers (CPI-AL/RL). 
Generate a concise intelligence briefing (max 200 words) based on the provided data. 
Focus on:
1. Key trends and patterns across states
2. States with highest inflation pressure
3. Risk assessment and what to watch for
4. Actionable insights for policymakers
Use bullet points. Be data-driven and specific. Reference state names and numbers.`;

    const userPrompt = `Labour Type: ${labourType === "AL" ? "Agricultural Labourers" : "Rural Labourers"}

Top Risk States (by risk score):
${stateData.slice(0, 10).map((s: any) => `- ${s.state}: Risk=${s.riskLevel}, Volatility=${s.volatility}%, Forecast Growth=${s.forecastGrowth}%, Acceleration=${s.acceleration}`).join("\n")}

Active Alerts (${alerts.length} total):
${alerts.slice(0, 8).map((a: any) => `- [${a.severity}] ${a.state}: ${a.message}`).join("\n")}

Top 5 Forecast Growth States:
${forecasts.slice(0, 5).map((f: any) => `- ${f.state}: +${f.projectedGrowthRate}% projected (confidence: ${f.confidenceLevel}%)`).join("\n")}

Generate a concise intelligence briefing.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to your workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || "Unable to generate insight.";

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cpi-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
