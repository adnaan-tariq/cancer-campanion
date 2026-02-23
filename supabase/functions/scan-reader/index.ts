/**
 * Scan Reader Edge Function — CancerCompanion
 *
 * Accepts a base64-encoded file (PDF or image) and analyzes it using:
 *   1. MedGemma (Kaggle) — tried first if KAGGLE_MODEL_URL is set
 *   2. aimlapi.com (gpt-4o) — supports PDFs via file type, images via image_url
 *
 * Supports: PDF, JPG, PNG — uses multimodal vision for all file types.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SCAN_SYSTEM_PROMPT = `You are a compassionate medical AI assistant powered by MedGemma. Given a patient's radiology or pathology report, provide:
1. A plain-English summary of what the report says (2-3 paragraphs, use **bold** for key terms)
2. Key medical terms explained simply
3. Questions the patient should ask their doctor
4. Links to trusted resources (cancer.gov, NIH)

Return valid JSON ONLY (no markdown fences):
{
  "summary": "...",
  "terms": [{"term": "...", "definition": "..."}],
  "questions": ["..."],
  "resources": [{"title": "...", "url": "..."}]
}`;

/** Try MedGemma on Kaggle first */
async function tryKaggleMedGemma(prompt: string, systemPrompt: string, timeoutMs = 5000): Promise<string | null> {
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
    const { fileBase64, mimeType, fileName } = await req.json();

    if (!fileBase64) {
      return new Response(JSON.stringify({ error: "File content is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing file: ${fileName} (${mimeType})`);

    // Try MedGemma first (text-only, works if the file is a text report)
    const medgemmaResult = await tryKaggleMedGemma(
      `Analyze this medical report file (${fileName}). The file content is provided as base64. Extract and explain the findings.`,
      SCAN_SYSTEM_PROMPT
    );

    if (medgemmaResult) {
      try {
        const cleaned = medgemmaResult.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return new Response(JSON.stringify({ ...parsed, modelUsed: "MedGemma (Primary)" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        console.warn("MedGemma response wasn't valid JSON, falling back...");
      }
    }

    // Fallback: Use aimlapi.com with gpt-4o (supports PDFs via file type, images via image_url)
    const AIMLAPI_API_KEY = Deno.env.get("AIMLAPI_API_KEY");
    if (!AIMLAPI_API_KEY) throw new Error("AIMLAPI_API_KEY not configured");

    const isImage = mimeType.startsWith("image/");
    console.log(`Using aimlapi.com (gpt-4o) — mode: ${isImage ? "image" : "file"}...`);

    // Build content parts per aimlapi docs:
    // Images → image_url with data URI
    // PDFs → file type with file_data
    const filePart = isImage
      ? {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${fileBase64}`,
          },
        }
      : {
          type: "file",
          file: {
            filename: fileName,
            file_data: `data:${mimeType};base64,${fileBase64}`,
          },
        };

    const userContentParts: unknown[] = [
      filePart,
      {
        type: "text",
        text: "Please analyze this medical report and provide a plain-English explanation. Extract all findings, key terms, suggest questions for the doctor, and provide trusted resource links. You MUST respond with valid JSON only.",
      },
    ];

    const response = await fetch("https://api.aimlapi.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIMLAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 4096,
        messages: [
          { role: "system", content: SCAN_SYSTEM_PROMPT },
          { role: "user", content: userContentParts },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("aimlapi.com error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Safely parse JSON — handle cases where model returns plain text instead
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.warn("AI response was not valid JSON, wrapping as summary. Preview:", cleaned.substring(0, 200));
      parsed = {
        summary: cleaned,
        terms: [],
        questions: [],
        resources: [],
      };
    }

    console.log("✅ Scan analysis complete");
    return new Response(JSON.stringify({ ...parsed, modelUsed: "gpt-4o via aimlapi.com" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-reader error:", e);
    return new Response(JSON.stringify({ error: "Unexpected server error. Please try again later." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
