"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hero, FullSection, SectionHeading, Card } from "@/components/ui";
import { ArrowRight } from "lucide-react";

const STATIC_INDUSTRIES = [
  { slug: "healthcare",    name: "Healthcare",    icon: "🏥", description: "Maternal care, diagnostics, telehealth, and health system strengthening across Ghana." },
  { slug: "agriculture",   name: "Agriculture",   icon: "🌾", description: "Farm management, agri-credit, marketplace, and supply chain for Ghanaian smallholders." },
  { slug: "real-estate",   name: "Real Estate",   icon: "🏢", description: "Property management, development tracking, and client portals for developers and managers." },
  { slug: "hospitality",   name: "Hospitality",   icon: "🏨", description: "Hotel operations, reservations, F&B, and guest experience management." },
  { slug: "construction",  name: "Construction",  icon: "🏗️", description: "Project management, contractor coordination, and materials tracking for construction firms." },
  { slug: "technology",    name: "Technology",    icon: "💻", description: "Software products, digital transformation, and AI integration for tech-forward organisations." },
];

export default function IndustriesPage() {
  const [industries, setIndustries] = useState(STATIC_INDUSTRIES);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/industries/`)
      .then((r) => r.json())
      .then((d) => { const list = d.results || d; if (list.length) setIndustries(list); })
      .catch(() => {});
  }, []);

  return (
    <>
      <Hero
        eyebrow="Industries"
        title="Six industries. One enterprise that understands them all."
        subtitle="Wolbi Royal Enterprise operates across healthcare, agriculture, real estate, hospitality, construction, and technology — with products and services tailored to each."
        cta={{ href: "/contact", label: "Discuss Your Industry" }}
      />
      <FullSection>
        <SectionHeading eyebrow="Sectors We Serve" title="Where Wolbi operates." center />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {industries.map((ind) => (
            <Link key={ind.slug || ind.id} href={`/industries/${ind.slug}`} style={{ textDecoration: "none" }}>
              <Card style={{ height: "100%", cursor: "pointer" }}>
                <div style={{ fontSize: "36px", marginBottom: "16px" }}>{ind.icon}</div>
                <p style={{ fontWeight: 700, fontSize: "17px", marginBottom: "8px" }}>{ind.name}</p>
                <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6, marginBottom: "20px" }}>
                  {ind.short_description || ind.description}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent)", fontSize: "13px", fontWeight: 600 }}>
                  Learn more <ArrowRight size={13} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </FullSection>
    </>
  );
}
