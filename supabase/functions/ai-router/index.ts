/**
 * AI Router Edge Function — CancerCompanion
 *
 * PURPOSE:
 *   Server-side wrapper around aimlapi.com so the API key is never exposed
 *   to the browser. The frontend (via `aiService.ts`) calls this function,
 *   and this function calls aimlapi with AIMLAPI_API_KEY from the environment.
 *
 * MODEL PRIORITY:
 *   1. MedGemma / TxGemma (Kaggle) — primary, when available
 *   2. Claude Sonnet via aimlapi.com — fallback when Kaggle is unavailable
 *
 * NOTE:
 *   AIMLAPI_API_KEY is configured as a Supabase Edge Function secret and is
 *   never shipped to the client.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, systemPrompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const AIMLAPI_API_KEY = Deno.env.get("AIMLAPI_API_KEY");
    if (!AIMLAPI_API_KEY) {
      return new Response(JSON.stringify({ error: "AIMLAPI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.aimlapi.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIMLAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        messages: [
          {
            role: "system",
            content:
              systemPrompt ||
              "You are a helpful medical AI assistant. Answer questions related to health and medicine accurately and responsibly. Always remind users to consult a doctor for professional advice.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("aimlapi router error:", res.status, text);
      return new Response(JSON.stringify({ error: `aimlapi failed: ${res.status}` }), {
        status: res.status === 429 ? 429 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({
        content,
        source: "Claude Sonnet (Backup)",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("ai-router error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

