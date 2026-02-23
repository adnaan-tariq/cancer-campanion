import { useState } from "react";
import { Phone, X, Siren } from "lucide-react";
import useEmergencyContacts from "@/hooks/useEmergencyContacts";

const EmergencyContactBanner = () => {
  const { loading, contacts, denied } = useEmergencyContacts();
  const [dismissed, setDismissed] = useState(false);

  if (loading || denied || !contacts || dismissed) return null;

  const items = [
    { label: "Emergency", value: contacts.emergency, icon: "🚨" },
    contacts.ambulance && { label: "Ambulance", value: contacts.ambulance, icon: "🚑" },
    contacts.poisonControl && { label: "Poison Control", value: contacts.poisonControl, icon: "☠️" },
    contacts.cancerHelpline && { label: "Cancer Helpline", value: contacts.cancerHelpline, icon: "🎗️" },
  ].filter(Boolean) as { label: string; value: string; icon: string }[];

  return (
    <div className="relative overflow-hidden border-b border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-accent/10 px-4 py-3">
      {/* Subtle decorative background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_70%)]" />

      <div className="container relative flex items-center justify-between gap-4">
        {/* Country badge */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 border border-primary/20">
            <Siren className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="text-lg leading-none">{contacts.flag}</span>
            <span className="font-serif font-semibold text-sm text-primary">
              {contacts.country}
            </span>
          </div>

          {/* Contact items */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {items.map((item, i) => (
              <a
                key={item.label}
                href={`tel:${item.value.replace(/\s/g, "")}`}
                className="group flex items-center gap-1.5 rounded-lg bg-background/60 backdrop-blur-sm border border-border/50 px-2.5 py-1 transition-all hover:bg-primary/10 hover:border-primary/30 hover:shadow-sm"
              >
                <span className="text-xs">{item.icon}</span>
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                  {item.value}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all"
          aria-label="Dismiss emergency contacts"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default EmergencyContactBanner;
