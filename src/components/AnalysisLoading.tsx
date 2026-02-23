import { Loader2 } from "lucide-react";

interface AnalysisLoadingProps {
  message?: string;
  submessage?: string;
}

const AnalysisLoading = ({
  message = "Analyzing your report",
  submessage = "This usually takes about 30 seconds — we're being thorough.",
}: AnalysisLoadingProps) => (
  <div className="flex flex-col items-center justify-center gap-4 py-16">
    <div className="relative">
      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    </div>
    <div className="text-center max-w-sm">
      <p className="font-serif text-lg font-semibold">{message}</p>
      <p className="text-sm text-muted-foreground mt-1">{submessage}</p>
    </div>
  </div>
);

export default AnalysisLoading;
