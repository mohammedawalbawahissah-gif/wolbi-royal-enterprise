"use client";

import { useEffect, useState } from "react";
import { Hero, FullSection, Section, SectionHeading, Card, Btn, FeatureItem, Tag } from "@/components/ui";
import { ArrowRight } from "lucide-react";

export default function DivisionPage({ division, hero, services: staticServices, products, about, extras }) {
  const [services, setServices] = useState(staticServices || []);

  useEffect(() => {
    if (!staticServices) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/services/?business_unit=${division}`)
        .then((r) => r.json())
        .then((d) => setServices(d.results || d))
        .catch(() => {});
    }
  }, []);

  return (
    <>
      <Hero {...hero} />

      {/* About */}
      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start" }}>
          <div>
            <SectionHeading eyebrow={hero.eyebrow} title={about.title} />
            {about.paragraphs.map((p, i) => (
              <p key={i} style={{ color: "var(--muted)", fontSize: "16px", lineHeight: 1.8, marginBottom: "16px" }}>{p}</p>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {about.highlights.map((h) => (
              <Card key={h.title} style={{ padding: "22px" }}>
                <FeatureItem icon={h.icon} title={h.title} description={h.description} />
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* Services */}
      {services.length > 0 && (
        <FullSection style={{ background: "var(--muted-bg)" }}>
          <SectionHeading eyebrow="What We Offer" title="Services" center />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {services.map((s) => (
              <Card key={s.id || s.name}>
                {s.icon && <div style={{ fontSize: "24px", marginBottom: "14px" }}>{s.icon}</div>}
                <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "8px" }}>{s.name}</p>
                <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.6 }}>{s.short_description}</p>
              </Card>
            ))}
          </div>
        </FullSection>
      )}

      {/* Products */}
      {products && products.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Flagship Products" title="Software from this division" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {products.map((p) => (
              <div key={p.name} style={{ background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)" }}>
                <div style={{ height: "5px", background: p.color || "var(--accent)" }} />
                <div style={{ padding: "28px" }}>
                  <Tag color={p.color || "var(--accent)"}>{p.industry}</Tag>
                  <p style={{ fontWeight: 800, fontSize: "20px", margin: "12px 0 8px" }}>{p.name}</p>
                  <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>{p.tagline}</p>
                  <Btn href={p.href} variant="secondary" style={{ fontSize: "13px", padding: "9px 18px" }}>
                    Explore {p.name} <ArrowRight size={12} />
                  </Btn>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Extras (Foundation-specific: programs, volunteer, etc.) */}
      {extras}

      {/* CTA */}
      <FullSection style={{ background: "linear-gradient(135deg, var(--primary-dark), var(--primary))", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 800, color: "#fff", marginBottom: "20px", letterSpacing: "-0.5px" }}>
          Ready to work with {hero.eyebrow}?
        </h2>
        <Btn href="/contact" variant="primary">Get in Touch <ArrowRight size={14} /></Btn>
      </FullSection>
    </>
  );
}
