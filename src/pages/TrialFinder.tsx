import { useState } from "react";
import { FlaskConical, MapPin, Phone, CheckCircle2, XCircle, ExternalLink, Stethoscope, Heart, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Layout from "@/components/Layout";
import AnalysisLoading from "@/components/AnalysisLoading";
import AudioBriefingPlayer from "@/components/AudioBriefingPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatSupabaseFunctionInvokeError } from "@/lib/formatSupabaseFunctionError";

type Trial = {
  id: string;
  title: string;
  location?: string;
  phone?: string;
  status?: string;
  matchScore: number;
  eligibility: string;
  requirements: string[];
  url?: string;
  doctorQuestions?: string[];
};

type State = "idle" | "loading" | "done" | "error";

const TrialFinder = () => {
  const [state, setState] = useState<State>("idle");
  const [summary, setSummary] = useState("");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [resultSummary, setResultSummary] = useState("");
  const [emotionalMessage, setEmotionalMessage] = useState("");
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const { toast } = useToast();

  const examples = [
    "58-year-old male, Stage IIIB non-small cell lung cancer (adenocarcinoma), KRAS G12C positive. Completed 4 cycles of carboplatin/pemetrexed. Currently stable disease on latest CT scan.",
    "45-year-old female, Stage II triple-negative breast cancer. Completed neoadjuvant AC-T chemotherapy. Partial response on MRI. Considering surgical options.",
    "67-year-old male, metastatic colorectal cancer with liver metastases. KRAS wild-type. Failed FOLFOX + bevacizumab. ECOG 1.",
  ];

  // Build TTS scripts from results (only sent to ElevenLabs when user clicks play)
  const buildOverviewScript = () => {
    const topTrials = trials.slice(0, 3);
    return `${emotionalMessage || "We've completed your clinical trial search."} We found ${trials.length} potential matches for you. ${topTrials.map((t, i) => `Your ${i === 0 ? "strongest" : i === 1 ? "second" : "third"} match is ${t.title}, with a ${t.matchScore} percent compatibility score. ${t.eligibility}`).join(". ")}. ${nextSteps.length ? `Here's what to do next: ${nextSteps.join(". ")}.` : ""} Remember, you're not alone in this journey.`;
  };

  const buildDoctorScript = () => {
    const topTrials = trials.slice(0, 3);
    return `Here are the key questions to bring to your oncologist appointment. ${topTrials.map((t) => `For the trial ${t.title}: ${(t.doctorQuestions || []).join(". ")}`).join(". Next trial: ")}. We recommend printing this list or saving it on your phone so you have it ready.`;
  };

  const buildTrialScript = (trial: Trial) => {
    return `About this trial: ${trial.title}. ${trial.eligibility}. Key things to know: ${trial.requirements.slice(0, 3).join(". ")}. ${trial.doctorQuestions?.length ? `Ask your doctor: ${trial.doctorQuestions[0]}` : ""}`;
  };

  const handleAnalyze = async () => {
    if (!summary.trim()) return;
    setState("loading");
    setTrials([]);
    setResultSummary("");
    setEmotionalMessage("");
    setNextSteps([]);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.functions.invoke("trial-finder", {
        body: { summary },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setTrials(data.trials || []);
      setResultSummary(data.summary || "");
      setEmotionalMessage(data.emotionalMessage || "");
      setNextSteps(data.nextSteps || []);
      setState("done");
    } catch (e: any) {
      console.error("Trial finder error:", e);
      const msg = formatSupabaseFunctionInvokeError(e);
      setErrorMsg(msg);
      setState("error");
      toast({ title: "Error", description: msg, variant: "destructive" });
    }
  };

  const reset = () => {
    setState("idle");
    setSummary("");
    setTrials([]);
    setResultSummary("");
    setEmotionalMessage("");
    setNextSteps([]);
    setErrorMsg("");
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-10 md:py-16 space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-healing text-sm font-medium">
            <FlaskConical className="h-4 w-4" />
            TrialFinder
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">
            Find clinical trials that match you
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Paste or type your oncology summary — diagnosis, stage, and any prior treatments — and we'll search for matching clinical trials.
          </p>
        </div>

        {state === "idle" && (
          <div className="space-y-4">
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Example: 58-year-old male, diagnosed with Stage IIIB non-small cell lung cancer (adenocarcinoma), KRAS G12C positive. Completed 4 cycles of carboplatin/pemetrexed. Currently stable disease on latest CT scan."
              className="min-h-[160px] text-base"
            />
            <Button onClick={handleAnalyze} size="lg" className="w-full sm:w-auto">
              Search for matching trials
            </Button>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Or try an example:</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((ex, i) => (
                  <Button key={i} variant="outline" size="sm" className="text-xs h-auto py-1.5 text-left" onClick={() => setSummary(ex)}>
                    {i === 0 ? "NSCLC — KRAS G12C" : i === 1 ? "Triple-Negative Breast" : "Metastatic Colorectal"}
                  </Button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Your information is used only for matching and is never stored.
            </p>
          </div>
        )}

        {state === "loading" && (
          <AnalysisLoading
            message="Searching clinical trials..."
            submessage="We're scanning ClinicalTrials.gov and matching against your profile. This may take up to a minute."
          />
        )}

        {state === "error" && (
          <div className="space-y-4 text-center">
            <p className="text-destructive">{errorMsg}</p>
            <Button variant="outline" onClick={reset}>Try again</Button>
          </div>
        )}

        {state === "done" && (
          <div className="space-y-6 animate-fade-in-up">

            {/* Emotional support message */}
            {emotionalMessage && (
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Heart className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <p className="text-sm leading-relaxed font-medium">{emotionalMessage}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* On-demand audio briefings */}
            {trials.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                <AudioBriefingPlayer
                  label="🎧 Your personalized briefing"
                  ttsText={buildOverviewScript()}
                />
                <AudioBriefingPlayer
                  label="🩺 What to ask your doctor"
                  ttsText={buildDoctorScript()}
                />
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {resultSummary || (
                <>Found <span className="font-semibold text-foreground">{trials.length} matching trials</span> based on your profile.</>
              )}
            </p>

            {/* Trial cards */}
            {trials.map((trial) => (
              <Card key={trial.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-mono">{trial.id}</p>
                      <CardTitle className="font-serif text-lg mt-1">{trial.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 shrink-0">
                      <span className="text-sm font-bold text-primary">{trial.matchScore}%</span>
                      <span className="text-xs text-muted-foreground">match</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Per-trial on-demand audio */}
                  <AudioBriefingPlayer
                    label={`🔊 Listen: ${trial.id}`}
                    ttsText={buildTrialScript(trial)}
                  />

                  <div className="rounded-lg bg-healing-light p-3">
                    <p className="text-sm font-medium text-secondary-foreground">{trial.eligibility}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Key requirements
                    </p>
                    {trial.requirements.map((req, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        {i < 2 ? (
                          <CheckCircle2 className="h-4 w-4 text-healing mt-0.5 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        {req}
                      </div>
                    ))}
                  </div>

                  {/* Doctor questions */}
                  {trial.doctorQuestions && trial.doctorQuestions.length > 0 && (
                    <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-primary" />
                        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                          Ask your oncologist
                        </p>
                      </div>
                      {trial.doctorQuestions.map((q, i) => (
                        <p key={i} className="text-sm text-foreground pl-6">• {q}</p>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {trial.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {trial.location}
                      </span>
                    )}
                    {trial.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />{" "}
                        <a href={`tel:${trial.phone.replace(/\s/g, "")}`} className="hover:underline">{trial.phone}</a>
                      </span>
                    )}
                    {trial.url && (
                      <a href={trial.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" /> View on ClinicalTrials.gov
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Next steps */}
            {nextSteps.length > 0 && (
              <Card className="border-accent/20">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-accent-foreground" />
                    <p className="font-serif font-semibold text-lg">What to do next</p>
                  </div>
                  <ol className="space-y-2 pl-1">
                    {nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        <span className="pt-0.5">{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}

            {trials.length === 0 && (
              <Card className="p-6 text-center">
                <p className="text-muted-foreground">No matching trials found. Try adjusting your summary with more details.</p>
              </Card>
            )}

            <div className="text-center">
              <Button variant="outline" onClick={reset}>Search again</Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TrialFinder;
