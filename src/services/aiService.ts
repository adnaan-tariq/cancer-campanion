/**
 * AI Model Priority System — CancerCompanion
 *
 * PRIMARY: Google MedGemma 4B-IT (HAI-DEF Model)
 *   - Hosted on Kaggle Notebooks with T4 GPU via ngrok tunnel
 *   - Kaggle provides 30 GPU hrs/week on free tier
 *   - The ngrok tunnel must be active (Kaggle notebook must be running)
 *   - If session has expired or GPU quota is exhausted, falls back automatically
 *   - Endpoint configured via VITE_KAGGLE_MODEL_URL
 *
 * SECONDARY (Drug Interactions): Google TxGemma 2B-predict (HAI-DEF Model)
 *   - Specialized model trained on drug-target interaction databases
 *   - Used exclusively in TreatmentNavigator for pharmacological analysis
 *   - Same Kaggle server, endpoint: VITE_KAGGLE_MODEL_URL/txgemma/interact
 *   - Silently skipped if unavailable — does not affect other functionality
 *
 * FALLBACK: Claude Sonnet via aimlapi.com (through Supabase Edge Function)
 *   - Activates automatically if MedGemma is unreachable
 *   - Ensures app remains fully functional regardless of Kaggle session state
 *   - Implemented server-side in the `ai-router` Edge Function, which reads
 *     AIMLAPI_API_KEY from Supabase secrets so the key is never exposed to
 *     the browser.
 *
 * NOTE ON RESOURCE CONSTRAINTS:
 *   We attempted to self-host MedGemma and TxGemma models on Kaggle Notebooks
 *   with T4 GPU acceleration. However, due to the free-tier limitations
 *   (30 GPU hrs/week, session timeouts, ngrok tunnel instability), we cannot
 *   guarantee 24/7 availability. As participants competing with limited resources
 *   in the Google MedGemma Impact Challenge, we use aimlapi.com as an always-on
 *   fallback to ensure our solution remains functional for evaluation at any time.
 *   When the Kaggle notebook is running, all requests go through the real
 *   MedGemma/TxGemma models as intended by the competition.
 */

import { supabase } from "@/integrations/supabase/client";

export type ModelSource =
  | "MedGemma (Primary)"
  | "Claude Sonnet (Backup)"
  | "connecting"
  | "idle";

export interface AIResponse {
  content: string;
  source: ModelSource;
}

type ModelStatusUpdater = (source: ModelSource) => void;

let statusUpdater: ModelStatusUpdater | null = null;

export function registerModelStatusUpdater(updater: ModelStatusUpdater) {
  statusUpdater = updater;
}

function updateStatus(source: ModelSource) {
  statusUpdater?.(source);
}

/**
 * Primary AI response function with MedGemma → aimlapi fallback.
 */
export async function getAIResponse(
  prompt: string,
  systemPrompt: string
): Promise<AIResponse> {
  const kaggleUrl = import.meta.env.VITE_KAGGLE_MODEL_URL;

  // ── Try MedGemma (Kaggle) first ──
  if (kaggleUrl) {
    console.log("🚀 Attempting MedGemma (Kaggle)...");
    updateStatus("connecting");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

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
      updateStatus("MedGemma (Primary)");
      return { content: data.response || data.text || data.content || JSON.stringify(data), source: "MedGemma (Primary)" };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`⚠️ MedGemma failed: ${message}`);
    }
  }

  // ── Fallback to aimlapi.com via Supabase Edge Function (`ai-router`) ──
  if (kaggleUrl) {
    console.log("🔄 Switching to aimlapi.com backup...");
    // Only show toast when we actually tried Kaggle and it failed
    showFallbackToast();
  }

  const { data, error } = await supabase.functions.invoke("ai-router", {
    body: {
      prompt,
      systemPrompt,
    },
  });

  if (error) {
    throw error;
  }
  if (data?.error) {
    throw new Error(data.error);
  }

  const content: string = data?.content ?? "";
  console.log("✅ Backup model responded successfully via ai-router");
  updateStatus("Claude Sonnet (Backup)");
  return { content, source: "Claude Sonnet (Backup)" };
}

/**
 * TxGemma drug interaction analysis — fails silently, never throws.
 */
export async function getTxGemmaAnalysis(
  drugs: string[],
  context: string
): Promise<string | null> {
  const kaggleUrl = import.meta.env.VITE_KAGGLE_MODEL_URL;
  if (!kaggleUrl) return null;

  console.log("💊 Attempting TxGemma drug interaction analysis...");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

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
  } catch (err) {
    console.warn("⚠️ TxGemma unavailable, skipping interaction analysis");
    return null;
  }
}

// ── Toast helper ──
let toastShown = false;
function showFallbackToast() {
  if (toastShown) return;
  toastShown = true;
  // Dispatch a custom event that the ModelStatusContext will listen to
  window.dispatchEvent(new CustomEvent("medgemma-fallback"));
  // Reset after 10s so future failures can also show a toast
  setTimeout(() => { toastShown = false; }, 10000);
}
