/**
 * Trial Finder Edge Function — CancerCompanion
 *
 * MODEL PRIORITY:
 *   1. MedGemma (Kaggle) — tried first for profile extraction & synthesis
 *   2. aimlapi.com — always-on fallback
 *
 * RESOURCE NOTE:
 *   We host MedGemma on Kaggle free-tier (30 GPU hrs/week, T4 GPU).
 *   Due to session timeouts and quota limits, the Kaggle endpoint may not
 *   always be available. The aimlapi fallback ensures uninterrupted functionality
 *   for competition judges evaluating at any time.
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { summary } = await req.json();

    if (!summary) {
      return new Response(JSON.stringify({ error: "Summary is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const AIMLAPI_API_KEY = Deno.env.get("AIMLAPI_API_KEY");
    if (!AIMLAPI_API_KEY) throw new Error("AIMLAPI_API_KEY not configured");

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");

    // ── Step 1: Extract structured patient profile (MedGemma → aimlapi) ──
    console.log("Step 1: Extracting patient profile...");

    const profileSystemPrompt = `You are a clinical trials matching AI. Extract a structured patient profile from the oncology summary. Be precise about cancer type, stage, biomarkers, and prior treatments.
Return valid JSON: { "cancerType": "...", "cancerSubtype": "...", "stage": "...", "biomarkers": ["..."], "priorTreatments": ["..."], "age": number, "sex": "...", "currentStatus": "...", "searchTerms": ["..."] }`;

    let profile: any = null;

    // Try MedGemma first
    const medgemmaResult = await tryKaggleMedGemma(summary, profileSystemPrompt);
    if (medgemmaResult) {
      try {
        const cleaned = medgemmaResult.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        profile = JSON.parse(cleaned);
      } catch {
        console.warn("MedGemma profile wasn't valid JSON, falling back...");
      }
    }

    // Fallback to aimlapi with tool calling
    if (!profile) {
      const profileRes = await fetch("https://api.aimlapi.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIMLAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a clinical trials matching AI. Extract a structured patient profile from the oncology summary. Be precise about cancer type, stage, biomarkers, and prior treatments.`,
            },
            { role: "user", content: summary },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_profile",
                description: "Extract structured patient profile for trial matching",
                parameters: {
                  type: "object",
                  properties: {
                    cancerType: { type: "string" },
                    cancerSubtype: { type: "string" },
                    stage: { type: "string" },
                    biomarkers: { type: "array", items: { type: "string" } },
                    priorTreatments: { type: "array", items: { type: "string" } },
                    age: { type: "number" },
                    sex: { type: "string" },
                    currentStatus: { type: "string" },
                    searchTerms: { type: "array", items: { type: "string" } },
                  },
                  required: ["cancerType", "stage", "searchTerms"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "extract_profile" } },
        }),
      });

      if (!profileRes.ok) {
        const t = await profileRes.text();
        console.error("Profile extraction error:", profileRes.status, t);
        throw new Error(`Profile extraction failed: ${profileRes.status}`);
      }

      const profileData = await profileRes.json();
      const toolCall = profileData.choices?.[0]?.message?.tool_calls?.[0];
      profile = toolCall
        ? JSON.parse(toolCall.function.arguments)
        : { cancerType: "cancer", stage: "unknown", searchTerms: [summary.slice(0, 80)] };
      console.log("✅ Backup model responded successfully");
    }

    console.log("Profile extracted:", JSON.stringify(profile));

    // ── Step 2: Search for trials via Firecrawl ──
    console.log("Step 2: Searching for clinical trials...");
    let trialResults: any[] = [];
    if (FIRECRAWL_API_KEY) {
      try {
        const searchQuery = `${profile.cancerType} ${profile.stage} ${(profile.biomarkers || []).join(" ")} clinical trial recruiting site:clinicaltrials.gov`;
        const fcRes = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: searchQuery, limit: 8 }),
        });
        if (fcRes.ok) {
          const fcData = await fcRes.json();
          trialResults = (fcData.data || []).map((r: any) => ({
            title: r.title || "",
            url: r.url || "",
            description: r.description || "",
            markdown: r.markdown || "",
          }));
        } else {
          console.error("Firecrawl error:", fcRes.status, await fcRes.text());
        }
      } catch (e) {
        console.error("Firecrawl failed:", e);
      }
    }

    // ── Step 3: Perplexity — deeper trial search ──
    console.log("Step 3: Getting trial context from Perplexity...");
    let perplexityTrials = "";
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
                content: "You are a clinical trials research assistant. Find currently recruiting clinical trials and provide details including NCT IDs, locations, and eligibility criteria. Be specific and factual.",
              },
              {
                role: "user",
                content: `Find currently recruiting clinical trials for: ${profile.cancerType}, ${profile.stage}${profile.biomarkers?.length ? `, biomarkers: ${profile.biomarkers.join(", ")}` : ""}. Patient is ${profile.age || "adult"} years old. Prior treatments: ${(profile.priorTreatments || []).join(", ") || "none listed"}.`,
              },
            ],
          }),
        });
        if (pplxRes.ok) {
          const pplxData = await pplxRes.json();
          perplexityTrials = pplxData.choices?.[0]?.message?.content || "";
        } else {
          console.error("Perplexity error:", pplxRes.status, await pplxRes.text());
        }
      } catch (e) {
        console.error("Perplexity failed:", e);
      }
    }

    // ── Step 4: Synthesize trials (MedGemma → aimlapi) ──
    console.log("Step 4: Synthesizing trial matches...");
    const synthesisInput = `
Patient Profile: ${JSON.stringify(profile)}

Firecrawl Results (from ClinicalTrials.gov):
${trialResults.map((r) => `- ${r.title}\n  URL: ${r.url}\n  ${r.description}`).join("\n\n")}

Perplexity Research:
${perplexityTrials}
    `.trim();

    const synthesisSystemPrompt = `You are a clinical trials matching expert. Given a patient profile and search results, produce:
1. A list of best matching trials with eligibility assessment
2. For EACH trial, write 2-3 specific questions the patient should ask their oncologist about that trial
3. Write an overall emotional support message (2-3 sentences, warm and encouraging)
4. Write a "what to do next" action plan (3-5 concrete steps)

Be compassionate and clear. If you can extract an NCT ID from the data, include it.

Return valid JSON: { "trials": [{ "id": "...", "title": "...", "location": "...", "phone": "...", "status": "...", "matchScore": number, "eligibility": "...", "requirements": ["..."], "url": "...", "doctorQuestions": ["..."] }], "summary": "...", "emotionalMessage": "...", "nextSteps": ["..."] }`;

    let matchedData: any = null;

    // Try MedGemma first for synthesis
    const synthesisMedgemma = await tryKaggleMedGemma(synthesisInput, synthesisSystemPrompt);
    if (synthesisMedgemma) {
      try {
        const cleaned = synthesisMedgemma.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        matchedData = JSON.parse(cleaned);
      } catch {
        console.warn("MedGemma synthesis wasn't valid JSON, falling back...");
      }
    }

    // Fallback to aimlapi with tool calling
    if (!matchedData) {
      const synthesisRes = await fetch("https://api.aimlapi.com/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIMLAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a clinical trials matching expert. Given a patient profile and search results, produce:
1. A list of best matching trials with eligibility assessment
2. For EACH trial, write 2-3 specific questions the patient should ask their oncologist about that trial
3. Write an overall emotional support message (2-3 sentences, warm and encouraging)
4. Write a "what to do next" action plan (3-5 concrete steps)

Be compassionate and clear. If you can extract an NCT ID from the data, include it.`,
            },
            { role: "user", content: synthesisInput },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_trials",
                description: "Return matched clinical trials with enhanced data",
                parameters: {
                  type: "object",
                  properties: {
                    trials: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          title: { type: "string" },
                          location: { type: "string" },
                          phone: { type: "string" },
                          status: { type: "string" },
                          matchScore: { type: "number" },
                          eligibility: { type: "string" },
                          requirements: { type: "array", items: { type: "string" } },
                          url: { type: "string" },
                          doctorQuestions: { type: "array", items: { type: "string" } },
                        },
                        required: ["id", "title", "matchScore", "eligibility", "requirements", "doctorQuestions"],
                      },
                    },
                    summary: { type: "string" },
                    emotionalMessage: { type: "string" },
                    nextSteps: { type: "array", items: { type: "string" } },
                  },
                  required: ["trials", "summary", "emotionalMessage", "nextSteps"],
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "return_trials" } },
        }),
      });

      if (!synthesisRes.ok) {
        const t = await synthesisRes.text();
        console.error("Synthesis error:", synthesisRes.status, t);
        throw new Error(`Trial synthesis failed: ${synthesisRes.status}`);
      }

      const synthesisData = await synthesisRes.json();
      const synthesisCall = synthesisData.choices?.[0]?.message?.tool_calls?.[0];
      matchedData = synthesisCall
        ? JSON.parse(synthesisCall.function.arguments)
        : { trials: [], summary: "Unable to find matching trials.", emotionalMessage: "", nextSteps: [] };
      console.log("✅ Backup model responded successfully");
    }

    console.log(`Found ${matchedData.trials?.length || 0} matched trials`);

    const result = {
      trials: matchedData.trials || [],
      summary: matchedData.summary || "",
      emotionalMessage: matchedData.emotionalMessage || "",
      nextSteps: matchedData.nextSteps || [],
      profile,
    };

    console.log("Trial finder complete!");
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("trial-finder error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";

    if (msg.includes("429") || msg.includes("rate limit")) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unexpected server error. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
