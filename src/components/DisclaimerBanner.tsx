import { ShieldCheck } from "lucide-react";

const DisclaimerBanner = () => (
  <div className="border-t border-border/50 bg-muted/30 backdrop-blur-sm px-4 py-3">
    <div className="container flex items-center gap-3 text-xs text-muted-foreground">
      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 shrink-0">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      </div>
      <p className="leading-relaxed">
        For informational purposes only — not a substitute for professional medical advice, diagnosis, or treatment.
      </p>
    </div>
  </div>
);

export default DisclaimerBanner;
