import Layout from "@/components/Layout";
import { Shield, Lock, Eye, Trash2, Download, Globe } from "lucide-react";

const sections = [
  {
    icon: Eye,
    title: "What Data We Collect",
    content:
      "We collect only the minimum data necessary to provide our services: your email address for authentication, and any medical reports you voluntarily upload for AI analysis. We do not collect browsing history, location data, or any information beyond what you explicitly provide.",
  },
  {
    icon: Lock,
    title: "How We Use Your Data",
    content:
      "Your uploaded medical reports are processed in real-time by our AI models to generate plain-language explanations, clinical trial matches, and treatment guidance. Reports are processed transiently and are not stored on our servers after analysis is complete.",
  },
  {
    icon: Shield,
    title: "Legal Basis for Processing",
    content:
      "We process your personal data based on your explicit consent (Article 6(1)(a) GDPR). You provide this consent when you create an account and upload documents for analysis. You may withdraw consent at any time by deleting your account.",
  },
  {
    icon: Globe,
    title: "International Data Transfers",
    content:
      "Your data may be processed on servers located outside the European Economic Area. Where this occurs, we ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the European Commission.",
  },
  {
    icon: Download,
    title: "Your Rights Under GDPR",
    content:
      "You have the right to access, rectify, erase, restrict processing, and port your personal data. You also have the right to object to processing and to lodge a complaint with your local data protection authority. To exercise any of these rights, contact us at privacy@cancercompanion.ai.",
  },
  {
    icon: Trash2,
    title: "Data Retention & Deletion",
    content:
      "Account data is retained for as long as your account is active. Uploaded medical documents are processed in real-time and not retained after analysis. Upon account deletion, all associated personal data is permanently removed within 30 days.",
  },
];

const GDPR = () => (
  <Layout>
    <div className="container max-w-4xl py-16 md:py-24">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-sm font-semibold text-primary border border-primary/20 mb-6">
          <Shield className="h-4 w-4" />
          GDPR Compliance
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
          General Data Protection Regulation
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          We are committed to protecting your privacy and ensuring your personal data is handled in accordance with the EU General Data Protection Regulation (GDPR).
        </p>
        <p className="text-xs text-muted-foreground mt-4">Last updated: February 2026</p>
      </div>

      <div className="space-y-6">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="card-elevated p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-bold text-foreground mb-2">{section.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 card-elevated p-6 md:p-8 bg-gradient-to-br from-primary/[0.03] to-transparent">
        <h2 className="font-serif text-xl font-bold text-foreground mb-2">Data Protection Officer</h2>
        <p className="text-muted-foreground leading-relaxed">
          For any questions regarding your data privacy or to exercise your GDPR rights, please contact our Data Protection Officer at{" "}
          <a href="mailto:privacy@cancercompanion.ai" className="text-primary font-semibold hover:underline">
            privacy@cancercompanion.ai
          </a>.
        </p>
      </div>
    </div>
  </Layout>
);

export default GDPR;
