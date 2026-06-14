"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { Hero, Section, FullSection, SectionHeading, Card, Btn } from "@/components/ui";
import { ArrowRight } from "lucide-react";

const STATIC = {
  healthcare:   { name: "Healthcare",   icon: "🏥", description: "Ghana's healthcare system faces persistent challenges around maternal mortality, diagnostic capacity, and inter-facility coordination. Wolbi addresses these through NeomatCare and Wolbi Medical Services.", solutions: [{ name: "NeomatCare", href: "/solutions/neomatcare", tagline: "Emergency referral and maternal care coordination." }] },
  agriculture:  { name: "Agriculture",  icon: "🌾", description: "Smallholder farmers in Ghana struggle with credit access, market linkage, and supply chain inefficiency. FarmaSyst provides the data layer and operational tools to change that.", solutions: [{ name: "FarmaSyst", href: "/solutions/farmasyst", tagline: "Agricultural management and agri-marketplace." }] },
  "real-estate": { name: "Real Estate", icon: "🏢", description: "Property developers and managers in Ghana manage complex portfolios with fragmented tools. MAGHAZ Assist brings it all into one platform.", solutions: [{ name: "MAGHAZ Assist", href: "/solutions/maghaz-assist", tagline: "Seven-module ERP for the built environment." }] },
  hospitality:  { name: "Hospitality",  icon: "🏨", description: "Hotel and hospitality operators need integrated reservation, operations, and financial management built for the African context.", solutions: [{ name: "MAGHAZ Assist", href: "/solutions/maghaz-assist", tagline: "Hospitality and hotel operations module." }] },
  construction: { name: "Construction", icon: "🏗️", description: "Construction firms need project visibility, contractor coordination, and materials tracking — in a single system that works on-site.", solutions: [{ name: "MAGHAZ Assist", href: "/solutions/maghaz-assist", tagline: "Construction project management module." }] },
  technology:   { name: "Technology",   icon: "💻", description: "Technology organisations need trusted software partners who can build, audit, and scale systems to professional standards.", solutions: [] },
};

export default function IndustryDetailPage({ params }) {
  const { slug } = use(params);
  const [industry, setIndustry] = useState(STATIC[slug] || null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/industries/${slug}/`)
      .then((r) => r.json())
      .then((d) => { if (d.name) setIndustry(d); })
      .catch(() => {});
  }, [slug]);

  if (!industry) return <div style={{ padding: "120px 2rem", textAlign: "center" }}><p>Loading…</p></div>;

  return (
    <>
      <Hero
        eyebrow="Industry"
        title={`${industry.icon || ""} ${industry.name}`}
        subtitle={industry.short_description || industry.description?.slice(0, 180)}
        cta={{ href: "/contact", label: `Discuss ${industry.name} Solutions` }}
      />

      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "64px", alignItems: "start" }}>
          <div>
            <SectionHeading eyebrow={industry.name} title="The challenge — and how Wolbi addresses it." />
            <p style={{ color: "var(--muted)", fontSize: "16px", lineHeight: 1.8, marginBottom: "20px" }}>
              {industry.description || industry.short_description}
            </p>
            {industry.challenges && (
              <>
                <h3 style={{ fontWeight: 700, marginBottom: "12px", fontSize: "16px" }}>Key Challenges</h3>
                <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: 1.8, marginBottom: "24px" }}>{industry.challenges}</p>
              </>
            )}
            {industry.wolbi_solutions && (
              <>
                <h3 style={{ fontWeight: 700, marginBottom: "12px", fontSize: "16px" }}>How Wolbi Helps</h3>
                <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: 1.8 }}>{industry.wolbi_solutions}</p>
              </>
            )}
          </div>
          <div>
            {(industry.solutions || []).map((s) => (
              <Card key={s.name} style={{ marginBottom: "16px" }}>
                <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "6px" }}>{s.name}</p>
                <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.6, marginBottom: "14px" }}>{s.tagline}</p>
                <Btn href={s.href} variant="secondary" style={{ fontSize: "13px", padding: "8px 16px" }}>
                  Explore {s.name} <ArrowRight size={12} />
                </Btn>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <FullSection style={{ background: "var(--primary)", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "#fff", marginBottom: "20px" }}>
          Working in {industry.name}? Let's talk.
        </h2>
        <Btn href="/contact" variant="primary">Get in Touch <ArrowRight size={14} /></Btn>
      </FullSection>
    </>
  );
}
