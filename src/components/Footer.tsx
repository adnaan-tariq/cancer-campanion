import { Link } from "react-router-dom";
import { Shield, ShieldCheck } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/50 bg-muted/30">
    <div className="container py-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <img src="/favicon.png" alt="CancerCompanion logo" className="h-7 w-7 rounded-md" />
          <span className="font-serif text-lg font-bold text-foreground">CancerCompanion</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm">
          <Link to="/gdpr" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
            <Shield className="h-3.5 w-3.5" />
            GDPR Policy
          </Link>
          <Link to="/hipaa" className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
            <ShieldCheck className="h-3.5 w-3.5" />
            HIPAA Compliance
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} CancerCompanion AI. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
