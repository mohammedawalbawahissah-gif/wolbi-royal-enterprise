"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Heart, Users, Leaf } from "lucide-react";
import { Hero, Section, FullSection, SectionHeading, Card, Btn, Stat, Tag, NewsletterInline } from "@/components/ui";

const DIVISIONS = [
  { icon: <Zap size={24} />, name: "Wolbi Technologies",      tagline: "Software, AI & digital transformation",              color: "var(--primary)", href: "/divisions/technologies" },
  { icon: <Heart size={24} />, name: "Wolbi Medical Services", tagline: "Health consulting, lab services & telehealth",       color: "#e11d48",        href: "/divisions/medical" },
  { icon: <Users size={24} />, name: "Wolbi Virtual Solutions",tagline: "Virtual assistance & business operations",           color: "#7c3aed",        href: "/divisions/virtual-solutions" },
  { icon: <Leaf size={24} />,  name: "Wolbi Foundation",       tagline: "Community health, education & youth impact",        color: "var(--accent)",  href: "/divisions/foundation" },
];

const PRODUCTS = [
  { key: "NEOMATCARE",   name: "NeomatCare",    industry: "Healthcare",                       tagline: "Emergency referral coordination for maternal and neonatal care across Ghana.",         href: "/solutions/neomatcare",    color: "#e11d48" },
  { key: "FARMASYST",    name: "FarmaSyst",     industry: "Agriculture",                      tagline: "End-to-end farm management, credit access, and agri-marketplace.",                    href: "/solutions/farmasyst",     color: "var(--accent)" },
  { key: "MAGHAZ_ASSIST",name: "MAGHAZ Assist", industry: "Real Estate · Hospitality · Construction", tagline: "A seven-module ERP for Africa's built environment.",             href: "/solutions/maghaz-assist", color: "var(--primary)" },
];

function DivisionCard({ icon, name, tagline, color, href }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Card style={{ height: "100%", cursor: "pointer" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", color, marginBottom: "20px" }}>
          {icon}
        </div>
        <p style={{ fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>{name}</p>
        <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>{tagline}</p>
        <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "6px", color, fontSize: "13px", fontWeight: 600 }}>
          Learn more <ArrowRight size={13} />
        </div>
      </Card>
    </Link>
  );
}

function ProductCard({ name, industry, tagline, href, color }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div
        style={{ background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", transition: "transform 0.2s, box-shadow 0.2s", height: "100%" }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
      >
        <div style={{ height: "6px", background: color }} />
        <div style={{ padding: "28px" }}>
          <Tag color={color}>{industry}</Tag>
          <p style={{ fontWeight: 800, fontSize: "22px", marginTop: "14px", marginBottom: "10px" }}>{name}</p>
          <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.7 }}>{tagline}</p>
          <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "6px", color, fontSize: "13px", fontWeight: 600 }}>
            Explore {name} <ArrowRight size={13} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState([]);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/testimonials/?featured=true`)
      .then((r) => r.json()).then((d) => setTestimonials(d.results || d)).catch(() => {});
  }, []);
  if (!testimonials.length) return null;
  return (
    <FullSection style={{ background: "var(--muted-bg)" }}>
      <SectionHeading eyebrow="Testimonials" title="Trusted by organisations across Africa" center />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
        {testimonials.map((t) => (
          <Card key={t.id} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontSize: "15px", lineHeight: 1.7, fontStyle: "italic" }}>"{t.quote}"</p>
            <div style={{ marginTop: "auto" }}>
              <p style={{ fontWeight: 700, fontSize: "14px" }}>{t.author_name}</p>
              <p style={{ fontSize: "12px", color: "var(--muted)" }}>{t.author_title}{t.author_company ? ` · ${t.author_company}` : ""}</p>
            </div>
          </Card>
        ))}
      </div>
    </FullSection>
  );
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <Hero
        badge="Born in Ghana. Built for Africa."
        title={<>Where healthcare meets<br />technology meets impact.</>}
        subtitle="Wolbi Royal Enterprise is a multi-division organisation delivering software, medical services, virtual assistance, and community programmes — founded in Tamale, Ghana."
        cta={{ href: "/about", label: "Our Story" }}
        cta2={{ href: "/contact", label: "Start a Conversation" }}
      >
        <div style={{ display: "flex", gap: "40px", marginTop: "56px", flexWrap: "wrap" }}>
          <Stat value="4"    label="Active Divisions" />
          <Stat value="3"    label="Flagship Products" />
          <Stat value="6+"   label="Industries Served" />
          <Stat value="GH"   label="Headquartered in Tamale" />
        </div>
      </Hero>

      {/* Divisions */}
      <Section>
        <SectionHeading
          eyebrow="Four Divisions"
          title="One enterprise, four distinct capabilities."
          subtitle="Each division is a specialist unit — together they give Wolbi Royal a range that no single-focus firm can match."
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
          {DIVISIONS.map((d) => {
            const { href, ...rest } = d;
            return <DivisionCard key={href} href={href} {...rest} />;
          })}
        </div>
      </Section>

      {/* Flagship Products */}
      <FullSection style={{ background: "var(--muted-bg)" }}>
        <SectionHeading
          eyebrow="Flagship Products"
          title="Software built from the inside out."
          subtitle="Each product emerged from real operational challenges — not market research. That's what makes them work."
          center
        />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
          {PRODUCTS.map((p) => {
            const { key, ...rest } = p;
            return <ProductCard key={key} {...rest} />;
          })}
        </div>
      </FullSection>

      {/* Founder strip with photo */}
      <FullSection style={{ background: "linear-gradient(135deg, var(--primary-dark), var(--primary))", padding: "0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", minHeight: "520px", alignItems: "stretch" }}>
          <div style={{ padding: "72px 56px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>Our Founder</p>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 42px)", fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: "8px", letterSpacing: "-0.5px" }}>
              Mohammed Awal Bawah Issah
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", marginBottom: "20px" }}>
              Medical Laboratory Scientist · Technology Specialist · Founder & CEO
            </p>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, maxWidth: "520px", marginBottom: "36px" }}>
              Mohammed didn't choose between medicine and technology — he mastered both. Every product Wolbi has built is the result of someone who operated inside the problem before writing a single line of code.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", maxWidth: "440px", marginBottom: "36px" }}>
              {[
                ["Medical Lab Science",  "Clinical foundation"],
                ["Software Engineering", "Technical execution"],
                ["NeomatCare",           "Healthcare innovation"],
                ["FarmaSyst",            "Agritech solutions"],
              ].map(([t, s]) => (
                <div key={t} style={{ background: "rgba(255,255,255,0.07)", borderRadius: "10px", padding: "16px" }}>
                  <p style={{ fontWeight: 700, fontSize: "13px", color: "#fff", marginBottom: "3px" }}>{t}</p>
                  <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{s}</p>
                </div>
              ))}
            </div>
            <div>
              <Btn href="/founder" variant="ghost">Meet Mohammed <ArrowRight size={14} /></Btn>
            </div>
          </div>

          {/* Photo */}
          <div style={{ position: "relative", overflow: "hidden", minHeight: "400px" }}>
            <Image
              src="/founder-primary.jpg"
              alt="Mohammed Awal Bawah Issah — Founder of Wolbi Royal Enterprise"
              fill
              style={{ objectFit: "cover", objectPosition: "top center" }}
              sizes="360px"
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to left, transparent 50%, var(--primary-dark))",
            }} />
          </div>
        </div>
      </FullSection>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* Newsletter */}
      <FullSection style={{ background: "var(--muted-bg)" }}>
        <div style={{ maxWidth: "560px", margin: "0 auto", textAlign: "center" }}>
          <SectionHeading eyebrow="Stay in the loop" title="Updates from Wolbi Royal" subtitle="Insights on health tech, agritech, and innovation across Africa — straight to your inbox." center />
          <NewsletterInline />
        </div>
      </FullSection>
    </>
  );
}
