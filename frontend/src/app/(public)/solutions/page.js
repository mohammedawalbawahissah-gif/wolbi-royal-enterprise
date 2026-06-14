import { Hero, Section, SectionHeading, Card, Btn, Tag } from "@/components/ui";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Solutions",
  description: "Three flagship software products from Wolbi Royal Enterprise — NeomatCare, FarmaSyst, and MAGHAZ Assist.",
};

const SOLUTIONS = [
  {
    name: "NeomatCare",
    industry: "Healthcare",
    tagline: "Emergency referral coordination for maternal and neonatal care across Ghana.",
    description: "NeomatCare addresses the coordination gap in Ghana's maternal and neonatal care pathway. It gives community health workers, midwives, district hospitals, and regional facilities a shared, real-time view of the referral pathway — so the right patient reaches the right facility at the right time.",
    color: "#e11d48",
    href: "/solutions/neomatcare",
    icon: "🏥",
    features: ["Emergency Referral Coordination", "ANC Visit Tracking", "Automatic Risk Flagging", "Patient Case Management", "Consent & Audit Logging", "Multi-role Access"],
  },
  {
    name: "FarmaSyst",
    industry: "Agriculture",
    tagline: "End-to-end agricultural management, credit access, and agri-marketplace.",
    description: "FarmaSyst creates the data layer that smallholder farmers need to access credit, connect with buyers, and manage their operations. From farm records and credit applications to marketplace listings and disbursement tracking — built specifically for Ghana's agricultural context.",
    color: "#16a34a",
    href: "/solutions/farmasyst",
    icon: "🌾",
    features: ["Farm Management & Records", "Credit Application & Workflow", "Agricultural Marketplace", "Repayment Schedule Tracking", "Farmer Contracts Portal", "Risk Assessment Tools"],
  },
  {
    name: "MAGHAZ Assist",
    industry: "Real Estate · Hospitality · Construction",
    tagline: "A seven-module ERP for Africa's built environment.",
    description: "MAGHAZ Assist brings the fragmented workflows of real estate developers, hotel operators, and construction firms into one integrated platform. Seven modules — independently functional, exponentially more powerful when connected.",
    color: "#1e3a5f",
    href: "/solutions/maghaz-assist",
    icon: "🏢",
    features: ["Property Management", "Hospitality Operations", "Construction Project Management", "Financial Management", "HR & Payroll", "CRM & Client Portal", "Analytics Dashboard"],
  },
];

export default function SolutionsPage() {
  return (
    <>
      <Hero
        eyebrow="Our Solutions"
        title="Software built from the inside out."
        subtitle="Three flagship platforms — each designed by someone who worked inside the industry it serves. That's what makes them different."
        cta={{ href: "/contact", label: "Request a Demo" }}
        cta2={{ href: "/about", label: "About the Enterprise" }}
      />

      <Section>
        <SectionHeading eyebrow="All Products" title="Explore our flagship solutions." center />
        <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>
          {SOLUTIONS.map((s) => (
            <div key={s.name} style={{
              background: "var(--card-bg)", borderRadius: "20px",
              border: "1px solid var(--border)", overflow: "hidden",
            }}>
              <div style={{ height: "6px", background: s.color }} />
              <div style={{ padding: "40px 48px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "40px" }}>{s.icon}</span>
                      <div>
                        <Tag color={s.color}>{s.industry}</Tag>
                        <h2 style={{ fontSize: "28px", fontWeight: 900, marginTop: "6px", letterSpacing: "-0.5px" }}>{s.name}</h2>
                      </div>
                    </div>
                    <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.7, marginBottom: "16px" }}>{s.tagline}</p>
                    <p style={{ fontSize: "15px", color: "var(--muted)", lineHeight: 1.8, marginBottom: "28px" }}>{s.description}</p>
                    <Btn href={s.href} variant="secondary" style={{ background: s.color, fontSize: "14px", padding: "11px 24px" }}>
                      Explore {s.name} <ArrowRight size={14} />
                    </Btn>
                  </div>
                  <div>
                    <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "14px" }}>Key Features</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {s.features.map((f) => (
                        <div key={f} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--muted-bg)", borderRadius: "8px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                          <p style={{ fontSize: "14px", fontWeight: 500 }}>{f}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
