import Image from "next/image";
import { Hero, Section, FullSection, SectionHeading, Card, Btn, FeatureItem } from "@/components/ui";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "About",
  description: "The story, mission, and values behind Wolbi Royal Enterprise — founded by Mohammed Awal Bawah Issah in Tamale, Ghana.",
};

const VALUES = [
  { icon: "🎯", title: "Purpose-driven",     description: "Every division and product exists to solve a real, observable problem in African communities." },
  { icon: "🔬", title: "Evidence-based",     description: "Mohammed's medical roots mean Wolbi holds its technology to clinical standards — rigour is non-negotiable." },
  { icon: "🤝", title: "Community-first",    description: "The Foundation is not CSR. It is a core division, funded and staffed alongside the commercial arms." },
  { icon: "🌍", title: "Context-aware",      description: "We build for the environments our clients actually operate in — not imported templates from elsewhere." },
  { icon: "🔓", title: "Transparent",        description: "We publish our roadmaps, share our thinking, and tell clients what we cannot yet do as clearly as what we can." },
  { icon: "📈", title: "Compounding impact", description: "Each win in one division feeds the others — a sustainable model, not a charity dependent on grants." },
];

const TIMELINE = [
  { year: "Foundation",        event: "Mohammed Awal Bawah Issah incorporates Wolbi Royal Enterprise as a multi-division holding entity, with Technology and Healthcare as the founding units — headquartered in Tamale, Ghana." },
  { year: "NeomatCare",        event: "Mohammed designs and builds NeomatCare — an emergency referral and maternal-neonatal coordination system for Ghanaian health facilities, drawing directly on his medical background." },
  { year: "FarmaSyst",         event: "FarmaSyst launched — an agricultural management ecosystem addressing credit access and supply chain gaps for smallholder farmers across Ghana." },
  { year: "MAGHAZ Assist",     event: "Seven-module ERP platform built for real estate, hospitality, and construction operators in Ghana and across Africa." },
  { year: "Virtual Solutions", event: "Wolbi Virtual Solutions division launched, offering professional remote staffing and business operations support." },
  { year: "Today",             event: "Four active divisions, three flagship platforms, six industries served — and growing under Mohammed's leadership from Tamale." },
];

export default function AboutPage() {
  return (
    <>
      <Hero
        eyebrow="About Wolbi Royal Enterprise"
        title="One founder. Multiple disciplines. Four divisions. One clear purpose."
        subtitle="Mohammed Awal Bawah Issah founded Wolbi Royal Enterprise in Tamale, Ghana — bringing together technology, healthcare, agriculture, real estate, virtual solutions, and community impact under one roof."
        cta={{ href: "/founder", label: "Meet Mohammed" }}
        cta2={{ href: "/contact", label: "Work with Us" }}
      />

      {/* Mission & Vision */}
      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start" }}>
          <div>
            <SectionHeading eyebrow="Our Objective" title= "A continent where every sector - healthcare, agriculture, real estate, and beyond, is underpinned by software and services designed specifically for it." />
            <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: "16px" }}>
              Wolbi Royal Enterprise was founded by Mohammed Awal Bawah Issah — a Medical Laboratory Scientist who became a Technology Specialist — on a simple but powerful thesis: the best technology for a system is built by someone who has worked inside it.
            </p>
            <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: "16px", marginTop: "16px" }}>
              Every product under the Wolbi umbrella — NeomatCare, FarmaSyst, MAGHAZ Assist — reflects that principle. Mohammed did not identify these markets through desk research. He experienced the gaps through years of professional practice, then built the solutions.
            </p>
            <p style={{ color: "var(--muted)", lineHeight: 1.8, fontSize: "16px", marginTop: "16px" }}>
              Today the enterprise spans four divisions serving six industries, anchored in Tamale. At the heart of the Foundation, Wolbi empowers communities.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {[
              { label: "Vision",   text: "Empowering Africa's industries through purposeful technology and innovation."},
              { label: "Mission",  text: "To build purposeful technology, deliver expert services, and invest in communities — through four specialised divisions operating as one coherent enterprise." },
              { label: "Approach", text: "Mohammed does not take on a project without understanding the full system around it. Every engagement starts with listening." },
            ].map(({ label, text }) => (
              <Card key={label} style={{ padding: "24px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--accent)", marginBottom: "10px" }}>{label}</p>
                <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.7 }}>{text}</p>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* Values */}
      <FullSection style={{ background: "var(--muted-bg)" }}>
        <SectionHeading eyebrow="What We Stand For" title="Six values. No exceptions." center />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {VALUES.map((v) => (
            <Card key={v.title}>
              <FeatureItem icon={v.icon} title={v.title} description={v.description} />
            </Card>
          ))}
        </div>
      </FullSection>

      {/* Timeline */}
      <Section>
        <SectionHeading eyebrow="Our Journey" title="How Mohammed built Wolbi Royal." />
        <div style={{ position: "relative", paddingLeft: "32px", borderLeft: "2px solid var(--border)" }}>
          {TIMELINE.map((item, i) => (
            <div key={i} style={{ marginBottom: "40px", position: "relative" }}>
              <div style={{
                position: "absolute", left: "-41px", top: "4px",
                width: "18px", height: "18px", borderRadius: "50%",
                background: "var(--accent)", border: "3px solid var(--background)",
              }} />
              <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: "var(--accent)", marginBottom: "6px" }}>{item.year}</p>
              <p style={{ color: "var(--muted)", fontSize: "15px", lineHeight: 1.7 }}>{item.event}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Founder strip with photo */}
      <FullSection style={{ background: "linear-gradient(135deg, var(--primary-dark), var(--primary))", padding: "0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", minHeight: "480px" }}>
          {/* Photo */}
          <div style={{ position: "relative", overflow: "hidden" }}>
            <Image
              src="/founder-secondary.jpg"
              alt="Mohammed Awal Bawah Issah"
              fill
              style={{ objectFit: "cover", objectPosition: "top center" }}
              sizes="380px"
            />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to right, transparent 60%, var(--primary-dark))",
            }} />
          </div>
          {/* Text */}
          <div style={{ padding: "64px 56px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>The Founder</p>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: "8px", letterSpacing: "-0.3px" }}>
              Mohammed Awal Bawah Issah
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", marginBottom: "24px" }}>
              Medical Laboratory Scientist · Technology Specialist<br />
              Founder & CEO · Tamale, Ghana
            </p>
            <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: "32px", maxWidth: "480px" }}>
              The enterprise Mohammed built is a direct product of his multiple professional identities — designed from the inside of the systems it serves, not from a distance.
            </p>
            <div>
              <Btn href="/founder" variant="ghost">Full Profile <ArrowRight size={14} /></Btn>
            </div>
          </div>
        </div>
      </FullSection>

      {/* CTA */}
      <FullSection style={{ textAlign: "center" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "var(--accent)", marginBottom: "16px" }}>Ready to work together?</p>
        <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800, marginBottom: "24px", letterSpacing: "-0.5px" }}>
          Let's build something that matters.
        </h2>
        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
          <Btn href="/contact" variant="secondary">Get in Touch <ArrowRight size={14} /></Btn>
          <Btn href="/solutions/neomatcare" variant="outline">Explore Our Products</Btn>
        </div>
      </FullSection>
    </>
  );
}
