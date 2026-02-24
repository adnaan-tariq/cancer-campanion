import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { FileSearch, BookOpen, MessageCircleQuestion, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/Layout";
import FileUpload from "@/components/FileUpload";
import AnalysisLoading from "@/components/AnalysisLoading";
import AudioBriefingPlayer from "@/components/AudioBriefingPlayer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatSupabaseFunctionInvokeError } from "@/lib/formatSupabaseFunctionError";

type AnalysisState = "idle" | "loading" | "done";

interface ScanResults {
  summary: string;
  terms: { term: string; definition: string }[];
  questions: string[];
  resources: { title: string; url: string }[];
  modelUsed?: string;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  return btoa(binary);
}

const ScanReader = () => {
  const [state, setState] = useState<AnalysisState>("idle");
  const [results, setResults] = useState<ScanResults | null>(null);
  const [analyzedFileName, setAnalyzedFileName] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setState("loading");
    setAnalyzedFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);

      const { data, error } = await supabase.functions.invoke("scan-reader", {
        body: {
          fileBase64: base64,
          mimeType: file.type || "application/pdf",
          fileName: file.name,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResults(data);
      setState("done");
    } catch (err) {
      console.error("ScanReader error:", err);
      toast({
        title: "Analysis failed",
        description: formatSupabaseFunctionInvokeError(err),
        variant: "destructive",
      });
      setState("idle");
    }
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-10 md:py-16 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-medium">
            <FileSearch className="h-4 w-4" />
            ScanReader
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold">
            Understand your scan results
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Upload your radiology or pathology report and we'll explain what it means in plain English — no medical degree required.
          </p>
        </div>

        {/* Upload */}
        {state === "idle" && (
          <div className="space-y-4">
            <FileUpload
              onFileSelect={handleFileSelect}
              label="Upload your report"
              description="Drop a PDF or image of your radiology/pathology report"
            />
            <p className="text-xs text-muted-foreground text-center">
              Supported: PDF, JPG, PNG • Your file is analyzed securely and never stored
            </p>
            <div className="text-center">
              <Button
                variant="link"
                size="sm"
                className="text-xs text-primary gap-1.5 h-auto p-0"
                onClick={async () => {
                  try {
                    const res = await fetch("/samples/sample-report.pdf");
                    const blob = await res.blob();
                    const file = new File([blob], "sample-report.pdf", { type: "application/pdf" });
                    handleFileSelect(file);
                  } catch {
                    toast({ title: "Error", description: "Could not load sample report.", variant: "destructive" });
                  }
                }}
              >
                <FileSearch className="h-3.5 w-3.5" />
                Try with a sample report
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {state === "loading" && (
          <AnalysisLoading
            message="Reading your report..."
            submessage="Our medical AI is carefully analyzing your scan. This usually takes about 30 seconds."
          />
        )}

        {/* Results */}
        {state === "done" && results && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Analyzed file indicator */}
            {analyzedFileName && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-primary/10 border border-primary/20 px-3 py-1.5 text-sm">
                <FileSearch className="h-3.5 w-3.5 text-primary" />
                <span className="text-muted-foreground">Results for:</span>
                <span className="font-semibold text-foreground">{analyzedFileName}</span>
              </div>
            )}

            {/* Audio */}
            <AudioBriefingPlayer label="Listen to your scan explanation" audioUrl="" isGenerating={false} />

            {/* Plain English summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <BookOpen className="h-5 w-5 text-primary" />
                  What your report says
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {results.summary}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Key terms */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Key terms explained</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {results.terms.map((t) => (
                  <div key={t.term} className="rounded-lg bg-muted p-3">
                    <p className="font-semibold text-sm">{t.term}</p>
                    <p className="text-sm text-muted-foreground">{t.definition}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Questions to ask */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-serif">
                  <MessageCircleQuestion className="h-5 w-5 text-primary" />
                  Questions to ask your doctor
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {results.questions.map((q, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{q}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Trusted resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.resources.map((r) => (
                  <a
                    key={r.url}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {r.title}
                  </a>
                ))}
              </CardContent>
            </Card>

            {/* Restart */}
            <div className="text-center">
              <Button variant="outline" onClick={() => { setState("idle"); setResults(null); setAnalyzedFileName(null); }}>
                Analyze another report
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ScanReader;
