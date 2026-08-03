import { Hero, Section, SectionHeading, Card, Btn } from "@/components/ui";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Divisions",
  description: "Four specialist divisions operating as one enterprise — Wolbi Technologies, Medical Services, Virtual Solutions, and Foundation.",
};

const DIVISIONS = [
  {
    icon: "💻",
    name: "Wolbi Technologies",
    tagline: "Software Engineering · Mobile · AI · Cyber Security · Data Science",
    description: "The engineering core of the enterprise. Every flagship product — NeomatCare, FarmaSyst, MAGHAZ Assist — was built here. Services span full stack development, mobile apps, cybersecurity, data analysis, machine learning, research, virtual assistance, and content creation.",
    color: "#1e3a5f",
    href: "/divisions/technologies",
    cta: "Explore Technologies",
  },
  {
    icon: "🏥",
    name: "Wolbi Medical Services",
    tagline: "Laboratory Diagnostics · USG Scans · DNA Testing · Health Advisory · Telehealth",
    description: "Clinical services delivered by Mohammed Awal Bawah Issah — a practising Medical Laboratory Scientist. From comprehensive lab diagnostics and imaging to DNA testing, health advisory, and remote consultations.",
    color: "#e11d48",
    href: "/divisions/medical",
    cta: "Explore Medical Services",
  },
  {
    icon: "🧑‍💼",
    name: "Wolbi Virtual Solutions",
    tagline: "Virtual Assistance · Admin Support · Research · Business Operations",
    description: "Professional remote staffing and business operations support — selected and managed to the same standard as in-house teams. Services include executive assistance, research, CRM management, and process coordination.",
    color: "#7c3aed",
    href: "/divisions/virtual-solutions",
    cta: "Explore Virtual Solutions",
  },
  {
    icon: "🌱",
    name: "Wolbi Foundation",
    tagline: "Health · Education · Youth Empowerment · Community Development",
    description: "A core division — not an afterthought. The Foundation runs programmes in health, education, technology access, and youth empowerment across Ghana. Open to volunteers, partners, and donors who share the mission.",
    color: "#16a34a",
    href: "/divisions/foundation",
    cta: "Explore the Foundation",
  },
];

export default function DivisionsPage() {
  return (
    <>
      <Hero
        eyebrow="Our Divisions"
        title="Four divisions. One enterprise. One standard."
        subtitle="Each division is a specialist unit with its own services, team, and focus — together they give Wolbi Royal Enterprise a range that no single-focus firm can match."
        cta={{ href: "/contact", label: "Work with Us" }}
        cta2={{ href: "/about", label: "About the Enterprise" }}
      />

      <Section>
        <SectionHeading eyebrow="All Divisions" title="Explore each division." center />
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {DIVISIONS.map((d, i) => (
            <div key={d.name} style={{
              display: "grid",
              gridTemplateColumns: i % 2 === 0 ? "1fr 2fr" : "2fr 1fr",
              gap: "0",
              background: "var(--card-bg)",
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid var(--border)",
            }}>
              {/* Colour panel */}
              {i % 2 === 0 && (
                <div style={{ background: `linear-gradient(135deg, ${d.color}dd, ${d.color})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 32px", minHeight: "240px" }}>
                  <div style={{ fontSize: "56px", marginBottom: "16px" }}>{d.icon}</div>
                  <p style={{ color: "#fff", fontWeight: 800, fontSize: "18px", textAlign: "center" }}>{d.name}</p>
                </div>
              )}
              {/* Content */}
              <div style={{ padding: "40px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: d.color, marginBottom: "10px" }}>{d.tagline}</p>
                <p style={{ fontSize: "16px", color: "var(--muted)", lineHeight: 1.8, marginBottom: "24px" }}>{d.description}</p>
                <div>
                  <Btn href={d.href} variant="secondary" style={{ background: d.color, fontSize: "14px", padding: "10px 22px" }}>
                    {d.cta} <ArrowRight size={14} />
                  </Btn>
                </div>
              </div>
              {/* Colour panel — right side for even rows */}
              {i % 2 !== 0 && (
                <div style={{ background: `linear-gradient(135deg, ${d.color}dd, ${d.color})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 32px", minHeight: "240px" }}>
                  <div style={{ fontSize: "56px", marginBottom: "16px" }}>{d.icon}</div>
                  <p style={{ color: "#fff", fontWeight: 800, fontSize: "18px", textAlign: "center" }}>{d.name}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
