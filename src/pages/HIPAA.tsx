import Layout from "@/components/Layout";
import { Shield, Lock, Server, UserCheck, FileWarning, Bell } from "lucide-react";

const sections = [
  {
    icon: Lock,
    title: "Protected Health Information (PHI)",
    content:
      "CancerCompanion AI processes Protected Health Information only when you voluntarily upload medical documents. We treat all uploaded reports as PHI and apply the highest level of security controls during processing.",
  },
  {
    icon: Server,
    title: "Technical Safeguards",
    content:
      "All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption. Access controls enforce least-privilege principles. Our infrastructure undergoes regular vulnerability assessments and penetration testing.",
  },
  {
    icon: UserCheck,
    title: "Administrative Safeguards",
    content:
      "Our team undergoes HIPAA compliance training. We maintain strict access controls ensuring only authorized personnel can interact with systems that process PHI. We conduct regular risk assessments and maintain comprehensive audit logs.",
  },
  {
    icon: Shield,
    title: "Physical Safeguards",
    content:
      "Our cloud infrastructure providers maintain SOC 2 Type II certification and comply with HIPAA requirements. Physical access to data centers is restricted with multi-factor authentication, biometric controls, and 24/7 surveillance.",
  },
  {
    icon: FileWarning,
    title: "Minimum Necessary Standard",
    content:
      "We adhere to the HIPAA minimum necessary standard. Our AI models process only the information needed to deliver the requested analysis. Medical reports are processed transiently and are not stored after your session ends.",
  },
  {
    icon: Bell,
    title: "Breach Notification",
    content:
      "In the unlikely event of a data breach involving PHI, we will notify affected individuals within 60 days as required by the HIPAA Breach Notification Rule. We will also notify the Department of Health and Human Services and, if applicable, the media.",
  },
];

const HIPAA = () => (
  <Layout>
    <div className="container max-w-4xl py-16 md:py-24">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-sm font-semibold text-primary border border-primary/20 mb-6">
          <Shield className="h-4 w-4" />
          HIPAA Compliance
        </div>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
          HIPAA Privacy & Security
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          CancerCompanion AI is designed with HIPAA compliance at its core, ensuring your protected health information is handled with the utmost care and security.
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
        <h2 className="font-serif text-xl font-bold text-foreground mb-2">HIPAA Inquiries</h2>
        <p className="text-muted-foreground leading-relaxed">
          For HIPAA-related questions or to report a potential security concern, contact our Privacy Officer at{" "}
          <a href="mailto:hipaa@cancercompanion.ai" className="text-primary font-semibold hover:underline">
            hipaa@cancercompanion.ai
          </a>.
        </p>
      </div>
    </div>
  </Layout>
);

export default HIPAA;
