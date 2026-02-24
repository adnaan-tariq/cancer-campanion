import { Link } from "react-router-dom";
import { FileSearch, FlaskConical, Pill, ArrowRight, Heart, Shield, Brain, Microscope, Dna, ExternalLink, Sparkles, Upload, Cpu, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

const tools = [
  {
    path: "/scan-reader",
    icon: FileSearch,
    title: "ScanReader",
    subtitle: "Powered by MedGemma",
    model: "MedGemma",
    description:
      "Upload your radiology or pathology report and get a plain-English explanation powered by Google's MedGemma — a medical imaging & text foundation model.",
    color: "bg-blue-500",
  },
  {
    path: "/trial-finder",
    icon: FlaskConical,
    title: "TrialFinder",
    subtitle: "Powered by MedGemma",
    model: "MedGemma",
    description:
      "Find clinical trials matching your diagnosis. MedGemma extracts key clinical details and matches them against trial eligibility criteria.",
    color: "bg-emerald-500",
  },
  {
    path: "/treatment-navigator",
    icon: Pill,
    title: "TreatmentNavigator",
    subtitle: "Powered by TxGemma",
    model: "TxGemma",
    description:
      "Enter your chemo regimen and get AI-guided side effect management powered by TxGemma — Google's therapeutics-focused foundation model.",
    color: "bg-amber-500",
  },
];

const models = [
  {
    name: "MedGemma",
    icon: Microscope,
    description: "Google's open medical AI model for clinical text understanding and medical image analysis. Powers ScanReader & TrialFinder.",
    capabilities: ["Pathology Report Analysis", "Medical Image Understanding", "Clinical Text Extraction"],
  },
  {
    name: "TxGemma",
    icon: Dna,
    description: "Google's therapeutics-focused model for drug interaction analysis, side effect prediction, and treatment guidance.",
    capabilities: ["Drug Interaction Analysis", "Side Effect Prediction", "Treatment Planning"],
  },
];

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload or Describe",
    description: "Upload your radiology/pathology report, paste your oncology summary, or enter your chemo regimen.",
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI Analyzes",
    description: "MedGemma & TxGemma process your input — extracting clinical details, matching trials, or mapping side effects.",
  },
  {
    number: "03",
    icon: FileText,
    title: "Get Clarity",
    description: "Receive plain-English explanations, matched trials with eligibility scores, or a day-by-day treatment guide.",
  },
];

const Index = () => {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute -top-20 right-0 h-[400px] w-[400px] rounded-full bg-primary/8 blur-[100px]" />

        <div className="container relative py-24 md:py-36 lg:py-44">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-sm font-semibold text-primary border border-primary/20">
                <Brain className="h-4 w-4" />
                Built with Google MedGemma & TxGemma
              </div>
              <a
                href="https://www.kaggle.com/competitions/med-gemma-impact-challenge"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                MedGemma Impact Challenge
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold leading-[1.05] text-foreground tracking-tight">
              We Take Care Of{" "}
              <span className="text-primary relative">
                Your Health
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 8C50 2 100 2 150 6C200 10 250 4 298 8" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                </svg>
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              From scan to clarity — powered by Google's <strong className="text-foreground">MedGemma</strong> & <strong className="text-foreground">TxGemma</strong> open medical AI models to translate your reports, find matching trials, and guide you through treatment.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/scan-reader">
                <Button size="lg" className="gap-2 text-base px-10 h-14 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/trial-finder">
                <Button size="lg" variant="outline" className="gap-2 text-base px-10 h-14 rounded-2xl border-border/80">
                  Find Trials
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Powered By Models Section */}
      <section className="container -mt-6 relative z-10 pb-16">
        <div className="text-center mb-8">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Powered By</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            Google Health AI Developer Foundations
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {models.map((model) => {
            const Icon = model.icon;
            return (
              <div key={model.name} className="card-elevated p-8 bg-gradient-to-br from-primary/[0.03] to-transparent">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-foreground">{model.name}</h3>
                    <p className="text-xs font-semibold text-primary">Google Open Model</p>
                  </div>
                </div>
                <p className="text-muted-foreground leading-relaxed mb-5">{model.description}</p>
                <div className="flex flex-wrap gap-2">
                  {model.capabilities.map((cap) => (
                    <span key={cap} className="text-xs font-medium bg-primary/10 text-primary rounded-full px-3 py-1.5">
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="container relative z-10 pb-20">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">How It Works</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            From Upload to Clarity in 3 Steps
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative card-elevated p-8 text-center">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ArrowRight className="h-5 w-5 text-primary/40" />
                  </div>
                )}
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <span className="text-xs font-bold text-primary/60 uppercase tracking-widest">Step {step.number}</span>
                <h3 className="font-serif text-xl font-bold text-foreground mt-2 mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Services / Tools */}
      <section className="container pb-20 md:pb-28">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Our Services</p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold">
            Here's What Makes Us Different
          </h2>
          <p className="text-muted-foreground mt-4 max-w-xl mx-auto text-lg">
            Each tool leverages Google's MedGemma & TxGemma models for a different stage of your cancer care journey.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link key={tool.path} to={tool.path} className="group">
                <div className="card-elevated p-8 h-full flex flex-col gap-5">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${tool.color} text-white shadow-lg`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-foreground">{tool.title}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Brain className="h-3.5 w-3.5 text-primary" />
                      <p className="text-sm text-primary font-semibold">{tool.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground leading-relaxed flex-1">
                    {tool.description}
                  </p>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all pt-2">
                    Try it now <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trust */}
      <section className="border-t bg-muted/30">
        <div className="container py-14 text-center space-y-4">
          <div className="inline-flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            <span className="font-semibold text-sm uppercase tracking-wider">Trusted & Secure</span>
          </div>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Built for the <strong className="text-foreground">MedGemma Impact Challenge</strong> on Kaggle. Powered by Google's open-source MedGemma & TxGemma medical AI models. Your data is never stored or shared.
          </p>
          <a
            href="https://www.kaggle.com/competitions/med-gemma-impact-challenge"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            View Competition on Kaggle <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
