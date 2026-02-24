import { Link } from "react-router-dom";
import { Shield, ShieldCheck, FileSearch, FlaskConical, Pill, Heart } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/50 bg-muted/30">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Brand + Mission */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <img src="/favicon.png" alt="CancerCompanion logo" className="h-7 w-7 rounded-md" />
            <span className="font-serif text-lg font-bold text-foreground">CancerCompanion</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            Bridging the gap between complex medical reports and patient understanding, powered by Google's open-source MedGemma & TxGemma models.
          </p>
        </div>

        {/* Tools */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Tools</p>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/scan-reader" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <FileSearch className="h-3.5 w-3.5" /> ScanReader
            </Link>
            <Link to="/trial-finder" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <FlaskConical className="h-3.5 w-3.5" /> TrialFinder
            </Link>
            <Link to="/treatment-navigator" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Pill className="h-3.5 w-3.5" /> TreatmentNavigator
            </Link>
          </div>
        </div>

        {/* Legal */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Legal</p>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/gdpr" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <Shield className="h-3.5 w-3.5" /> GDPR Policy
            </Link>
            <Link to="/hipaa" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
              <ShieldCheck className="h-3.5 w-3.5" /> HIPAA Compliance
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-10 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} CancerCompanion AI. All rights reserved.
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Heart className="h-3 w-3 text-primary" />
          Not a substitute for professional medical advice.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
