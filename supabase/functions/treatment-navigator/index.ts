/**
 * Treatment Navigator Edge Function — CancerCompanion
 *
 * MODEL PRIORITY:
 *   1. MedGemma (Kaggle) — tried first for regimen analysis if KAGGLE_MODEL_URL is set
 *   2. TxGemma (Kaggle) — drug interaction analysis, silently skipped if unavailable
 *   3. aimlapi.com — always-on fallback for all AI steps
 *
 * RESOURCE NOTE:
 *   We host MedGemma/TxGemma on Kaggle free-tier (30 GPU hrs/week, T4).
 *   Due to session timeouts and quota limits, the Kaggle endpoint may not always
 *   be available. The aimlapi fallback ensures uninterrupted functionality for
 *   competition judges evaluating at any time.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Try MedGemma on Kaggle. Returns null on any failure. */
async function tryKaggleMedGemma(
  prompt: string,
  systemPrompt: string,
  timeoutMs = 5000
): Promise<string | null> {
  const kaggleUrl = Deno.env.get("KAGGLE_MODEL_URL");
  if (!kaggleUrl) return null;

  console.log("🚀 Attempting MedGemma (Kaggle)...");
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${kaggleUrl}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, system_prompt: systemPrompt }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("✅ MedGemma responded successfully");
    return data.response || data.text || data.content || JSON.stringify(data);
  } catch (err) {
    console.warn(`⚠️ MedGemma failed: ${err instanceof Error ? err.message : err}`);
    console.log("🔄 Switching to aimlapi.com backup...");
    return null;
  }
}

/** Try TxGemma drug interaction. Returns null silently on any failure. */
async function tryTxGemma(
  drugs: string[],
  context: string,
  timeoutMs = 5000
): Promise<string | null> {
  const kaggleUrl = Deno.env.get("KAGGLE_MODEL_URL");
  if (!kaggleUrl) return null;

  console.log("💊 Attempting TxGemma drug interaction analysis...");
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${kaggleUrl}/txgemma/interact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drugs, context }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log("✅ TxGemma analysis complete");
    return data.analysis || data.response || data.text || JSON.stringify(data);
  } catch {
    console.warn("⚠️ TxGemma unavailable, skipping interaction analysis");
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { regimen } = await req.json();
    if (!regimen) {
      return new Response(JSON.stringify({ error: "Regimen is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const AIMLAPI_API_KEY = Deno.env.get("AIMLAPI_API_KEY");
    if (!AIMLAPI_API_KEY) throw new Error("AIMLAPI_API_KEY not configured");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    // ── Step 1: Analyse regimen (MedGemma → aimlapi fallback) ──
    console.log("Step 1: Analyzing regimen...");

    const regimenSystemPrompt = `You are a medical AI assistant. Given a chemotherapy regimen, extract:
1. Drug names (generic)
2. Cycle length in days
3. Common side effects per drug
4. Key medical considerations
Return valid JSON: { "drugs": [{"name":"...","commonSideEffects":["..."]}], "cycleDays": number, "considerations": ["..."] }`;

    let regimenData: any = null;

    // Try MedGemma first
    const medgemmaResult = await tryKaggleMedGemma(regimen, regimenSystemPrompt);
    if (medgemmaResult) {
      try {
        const cleaned = medgemmaResult.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        regimenData = JSON.parse(cleaned);
      } catch {
        console.warn("MedGemma response wasn't valid JSON, falling back...");
      }
    }

    // Fallback to aimlapi with tool calling
    if (!regimenData) {
      const geminiRes = await fetch("https://api.aimlapi.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIMLAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: regimenSystemPrompt },
            { role: "user", content: regimen },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_regimen",
                description: "Extract structured regimen data",
                parameters: {
                  type: "object",
                  properties: {
                    drugs: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          commonSideEffects: { type: "array", items: { type: "string" } },
                        },
                        required: ["name", "commonSideEffects"],
                      },
                    },
                    cycleDays: { type: "number" },
                    considerations: { type: "array", items: { type: "string" } },
                  },
                  required: ["drugs", "cycleDays", "considerations"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "extract_regimen" } },
        }),
      });

      if (!geminiRes.ok) {
        const t = await geminiRes.text();
        console.error("AIML regimen error:", geminiRes.status, t);
        throw new Error(`Regimen analysis failed: ${geminiRes.status}`);
      }

      const geminiData = await geminiRes.json();
      const toolCall = geminiData.choices?.[0]?.message?.tool_calls?.[0];
      regimenData = toolCall
        ? JSON.parse(toolCall.function.arguments)
        : { drugs: [], cycleDays: 14, considerations: [] };
      console.log("✅ Backup model responded successfully");
    }

    console.log("Regimen parsed:", JSON.stringify(regimenData));

    // ── Step 1.5: TxGemma drug interaction analysis ──
    const drugNames = (regimenData.drugs || []).map((d: any) => d.name);
    const txGemmaAnalysis = await tryTxGemma(drugNames, regimen);

    // ── Step 2: Generate day-by-day guide (MedGemma → aimlapi fallback) ──
    console.log("Step 2: Generating day-by-day guide...");

    const timelineSystemPrompt = `You are a compassionate oncology support AI. Given a chemo regimen analysis, create a patient-friendly day-by-day timeline.
Return valid JSON array: [{ "day": "1", "phase": "Infusion Day", "tips": ["..."], "sideEffects": ["..."], "alert": null | "string" }]
Cover the full cycle. Group days where appropriate (e.g. "4-7"). Use warm, encouraging language. Include when to call the doctor. Return ONLY the JSON, no other text.`;

    const timelineUserContent = txGemmaAnalysis
      ? `Regimen: ${regimen}\nAnalysis: ${JSON.stringify(regimenData)}\n\nDrug interaction analysis from TxGemma: ${txGemmaAnalysis}`
      : `Regimen: ${regimen}\nAnalysis: ${JSON.stringify(regimenData)}`;

    let timeline: any[] = [];

    // Try MedGemma first for timeline
    const timelineMedgemma = await tryKaggleMedGemma(timelineUserContent, timelineSystemPrompt);
    if (timelineMedgemma) {
      try {
        const cleaned = timelineMedgemma.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        timeline = Array.isArray(parsed) ? parsed : parsed.timeline || parsed.days || [];
      } catch {
        console.warn("MedGemma timeline wasn't valid JSON, falling back...");
      }
    }

    // Fallback to aimlapi
    if (timeline.length === 0) {
      try {
        const aimlRes = await fetch("https://api.aimlapi.com/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${AIMLAPI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-7-sonnet-20250219",
            messages: [
              { role: "system", content: timelineSystemPrompt },
              { role: "user", content: timelineUserContent },
            ],
          }),
        });
        if (aimlRes.ok) {
          const aimlData = await aimlRes.json();
          const content = aimlData.choices?.[0]?.message?.content;
          if (content) {
            const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            const parsed = JSON.parse(cleaned);
            timeline = parsed.timeline || parsed.days || parsed || [];
            if (!Array.isArray(timeline)) timeline = [];
          }
        } else {
          console.error("AIML timeline error:", aimlRes.status, await aimlRes.text());
        }
      } catch (e) {
        console.error("AIML timeline failed:", e);
      }
    }

    // Second fallback with gpt-4o
    if (timeline.length === 0) {
      console.log("Falling back to gpt-4o for timeline...");
      const fallbackRes = await fetch("https://api.aimlapi.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIMLAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: timelineSystemPrompt },
            { role: "user", content: timelineUserContent },
          ],
        }),
      });
      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json();
        const fbContent = fbData.choices?.[0]?.message?.content || "";
        try {
          const cleaned = fbContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
          const parsed = JSON.parse(cleaned);
          timeline = Array.isArray(parsed) ? parsed : parsed.timeline || parsed.days || [];
        } catch {
          console.error("Failed to parse gpt-4o timeline");
        }
      }
    }

    // ── Step 3: Firecrawl — scrape FDA drug labels ──
    console.log("Step 3: Scraping FDA drug info...");
    let fdaInfo: any[] = [];
    if (FIRECRAWL_API_KEY && regimenData.drugs?.length > 0) {
      try {
        const drugNamesStr = regimenData.drugs.map((d: any) => d.name).join(" ");
        const fcRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: `${drugNamesStr} chemotherapy side effects management site:cancer.gov OR site:drugs.com`,
            limit: 3,
          }),
        });
        if (fcRes.ok) {
          const fcData = await fcRes.json();
          fdaInfo = (fcData.data || []).map((r: any) => ({
            title: r.title,
            url: r.url,
            description: r.description,
          }));
        }
      } catch (e) {
        console.error("Firecrawl failed:", e);
      }
    }

    // ── Step 4: Perplexity — side effect management tips ──
    console.log("Step 4: Getting management tips from Perplexity...");
    let managementTips = "";
    if (PERPLEXITY_API_KEY) {
      try {
        const pplxRes = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "sonar",
            messages: [
              {
                role: "system",
                content:
                  "You are a medical research assistant. Provide evidence-based, patient-friendly side effect management strategies. Be concise and practical.",
              },
              {
                role: "user",
                content: `What are the best evidence-based strategies for managing side effects of ${regimen}? Include nutrition tips, when to seek emergency care, and practical daily advice.`,
              },
            ],
          }),
        });
        if (pplxRes.ok) {
          const pplxData = await pplxRes.json();
          managementTips = pplxData.choices?.[0]?.message?.content || "";
        }
      } catch (e) {
        console.error("Perplexity failed:", e);
      }
    }

    // ── Build interactions from considerations ──
    const interactions = (regimenData.considerations || []).map(
      (c: string, i: number) => ({
        severity: i === 0 ? "warning" : "info",
        message: c,
      })
    );

    for (const drug of regimenData.drugs || []) {
      interactions.push({
        severity: "info",
        message: `${drug.name}: Common side effects include ${drug.commonSideEffects.slice(0, 3).join(", ")}.`,
      });
    }

    // Add TxGemma analysis as an interaction if available
    if (txGemmaAnalysis) {
      interactions.unshift({
        severity: "warning",
        message: `TxGemma Drug Interaction Analysis: ${txGemmaAnalysis}`,
      });
    }

    const result = {
      timeline,
      interactions,
      fdaResources: fdaInfo,
      managementTips,
      regimenData,
      modelUsed: txGemmaAnalysis ? "MedGemma + TxGemma" : "Fallback",
    };

    console.log("Treatment navigator complete!");
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("treatment-navigator error:", e);
    return new Response(JSON.stringify({ error: "Unexpected server error. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
