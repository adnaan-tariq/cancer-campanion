import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Pill, AlertTriangle, Sun, Moon, Clock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import AnalysisLoading from "@/components/AnalysisLoading";
import AudioBriefingPlayer from "@/components/AudioBriefingPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatSupabaseFunctionInvokeError } from "@/lib/formatSupabaseFunctionError";

type State = "idle" | "loading" | "done";

interface TimelineDay {
  day: string | number;
  phase: string;
  tips: string[];
  sideEffects: string[];
  alert: string | null;
}

interface Interaction {
  severity: "info" | "warning";
  message: string;
}

interface FdaResource {
  title: string;
  url: string;
  description: string;
}

interface AnalysisResult {
  timeline: TimelineDay[];
  interactions: Interaction[];
  fdaResources: FdaResource[];
  managementTips: string;
}

const dayIcon = (day: string | number) => {
  const d = typeof day === "number" ? day : parseInt(day);
  if (d === 1) return Sun;
  if (d === 2) return Moon;
  if (d === 3) return AlertTriangle;
  if (d <= 7 || String(day).includes("4")) return Sun;
  return Clock;
};

const TreatmentNavigator = () => {
  const [state, setState] = useState<State>("idle");
  const [regimen, setRegimen] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const examples = [
    "FOLFOX (5-FU, Leucovorin, Oxaliplatin) — 14-day cycle",
    "AC-T (Doxorubicin, Cyclophosphamide → Paclitaxel) — 21-day cycle",
    "Carboplatin + Pemetrexed — 21-day cycle",
    "R-CHOP (Rituximab, Cyclophosphamide, Doxorubicin, Vincristine, Prednisone) — 21-day cycle",
    "ABVD (Doxorubicin, Bleomycin, Vinblastine, Dacarbazine) — 28-day cycle",
    "Gemcitabine + Cisplatin — 21-day cycle",
  ];

  const handleAnalyze = async () => {
    if (!regimen.trim()) return;
    setState("loading");
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("treatment-navigator", {
        body: { regimen },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult({
        timeline: data.timeline || [],
        interactions: data.interactions || [],
        fdaResources: data.fdaResources || [],
        managementTips: data.managementTips || "",
      });
      setState("done");
    } catch (e: any) {
      console.error("Analysis failed:", e);
      toast({
        title: "Analysis failed",
        description: formatSupabaseFunctionInvokeError(e),
        variant: "destructive",
      });
      setState("idle");
    }
  };

  // Build TTS script on-demand
  const buildAudioScript = () => {
    if (!result?.timeline?.length) return "";
    const day1 = result.timeline[0];
    return `Welcome to your treatment guide. Today is ${day1.phase || "Day 1"} of your ${regimen.split("(")[0].trim()} cycle. ${(day1.tips || []).slice(0, 2).join(". ")}. Remember, this is temporary, and your care team is here for you.`;
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-10 md:py-16 space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-peach-dark text-sm font-medium">
            <Pill className="h-4 w-4" />
            TreatmentNavigator
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">
            Your day-by-day treatment guide
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Enter your chemotherapy regimen and we'll create a personalized timeline of what to expect each day — including side effects, tips, and when to call your doctor.
          </p>
        </div>

        {state === "idle" && (
          <div className="space-y-4">
            <Textarea
              value={regimen}
              onChange={(e) => setRegimen(e.target.value)}
              placeholder="e.g. FOLFOX (5-FU, Leucovorin, Oxaliplatin) — 14-day cycle"
              className="min-h-[100px] text-base"
            />
            <Button onClick={handleAnalyze} size="lg" className="w-full sm:w-auto">
              Create my treatment guide
            </Button>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Or try an example:</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((ex, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1.5 text-left"
                    onClick={() => setRegimen(ex)}
                  >
                    {ex.split("(")[0].trim()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {state === "loading" && (
          <AnalysisLoading
            message="Building your treatment timeline..."
            submessage="We're analyzing your regimen, checking drug interactions, and creating your personalized guide."
          />
        )}

        {state === "done" && result && (
          <div className="space-y-6 animate-fade-in-up">
            <AudioBriefingPlayer label="Day 1 audio check-in" ttsText={buildAudioScript()} />

            {/* Drug interactions */}
            {result.interactions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Drug Interaction Analysis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.interactions.map((item, i) => (
                    <div
                      key={i}
                      className={`rounded-lg p-3 text-sm ${
                        item.severity === "warning"
                          ? "bg-hope-light border border-hope/30"
                          : "bg-muted"
                      }`}
                    >
                      {item.severity === "warning" && (
                        <Badge variant="outline" className="mb-1 text-hope border-hope/40 text-xs">
                          Note
                        </Badge>
                      )}
                      <p>{item.message}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Management tips from Perplexity */}
            {result.managementTips && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Evidence-Based Management Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none [&_h3]:font-serif [&_h3]:text-lg [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:font-serif [&_h4]:text-base [&_h4]:mt-3 [&_h4]:mb-1 [&_strong]:text-foreground [&_li]:text-muted-foreground [&_p]:text-muted-foreground">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {result.managementTips}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            {result.timeline.length > 0 && (
              <div className="space-y-4">
                <h2 className="font-serif text-2xl font-bold">Your cycle timeline</h2>
                {result.timeline.map((day, i) => {
                  const Icon = dayIcon(day.day);
                  return (
                    <Card key={i}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="flex flex-col items-center shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <Icon className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div className="space-y-3 flex-1">
                            <p className="font-serif font-bold text-lg">
                              Day {day.day} — {day.phase}
                            </p>

                            <div className="flex flex-wrap gap-1.5">
                              {(day.sideEffects || []).map((se) => (
                                <Badge key={se} variant="secondary" className="text-xs">
                                  {se}
                                </Badge>
                              ))}
                            </div>

                            <ul className="space-y-1">
                              {(day.tips || []).map((tip, j) => (
                                <li key={j} className="text-sm text-muted-foreground flex gap-2">
                                  <span className="text-primary mt-1">•</span>
                                  {tip}
                                </li>
                              ))}
                            </ul>

                            {day.alert && (
                              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 flex gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                <p className="text-sm text-destructive font-medium">{day.alert}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* FDA Resources */}
            {result.fdaResources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Drug Information Resources</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.fdaResources.map((r, i) => (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <ExternalLink className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.description}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="text-center">
              <Button variant="outline" onClick={() => { setState("idle"); setRegimen(""); setResult(null); }}>
                Try another regimen
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TreatmentNavigator;
