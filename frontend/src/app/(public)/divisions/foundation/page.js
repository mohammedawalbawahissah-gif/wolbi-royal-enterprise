"use client";

import { useEffect, useState } from "react";
import { Hero, FullSection, Section, SectionHeading, Card, Btn, FeatureItem } from "@/components/ui";
import { ArrowRight } from "lucide-react";

function ProgramsSection() {
  const [programs, setPrograms] = useState([]);
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/foundation/programs/`)
      .then((r) => r.json()).then((d) => setPrograms(d.results || d)).catch(() => {});
  }, []);

  if (!programs.length) return null;
  return (
    <FullSection style={{ background: "var(--muted-bg)" }}>
      <SectionHeading eyebrow="Our Programs" title="What the Foundation does." center />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {programs.map((p) => (
          <Card key={p.id}>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--accent)", marginBottom: "10px" }}>{p.focus_area}</p>
            <p style={{ fontWeight: 700, fontSize: "16px", marginBottom: "10px" }}>{p.name}</p>
            <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>{p.description}</p>
          </Card>
        ))}
      </div>
    </FullSection>
  );
}

function VolunteerForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", interest: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/foundation/volunteers/`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      setStatus(res.ok ? "success" : "error");
    } catch { setStatus("error"); } finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "14px" };

  if (status === "success") return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <p style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>Application received — thank you.</p>
      <p style={{ color: "var(--muted)" }}>A member of the Foundation team will be in touch.</p>
    </div>
  );

  return (
    <form onSubmit={submit} style={{ maxWidth: "560px", margin: "0 auto" }}>
      {[{ label: "Full Name", key: "name", type: "text" }, { label: "Email Address", key: "email", type: "email" }, { label: "Phone (optional)", key: "phone", type: "tel" }].map(({ label, key, type }) => (
        <div key={key} style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>{label}</label>
          <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={inp} required={key !== "phone"} />
        </div>
      ))}
      <div style={{ marginBottom: "24px" }}>
        <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>Why do you want to volunteer?</label>
        <textarea value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} rows={4} style={inp} required />
      </div>
      {status === "error" && <p style={{ color: "#ef4444", marginBottom: "16px", fontSize: "14px" }}>Something went wrong. Please try again.</p>}
      <button type="submit" disabled={loading} style={{ padding: "12px 28px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Submitting…" : "Submit Application"}
      </button>
    </form>
  );
}

export default function FoundationPage() {
  return (
    <>
      <Hero
        eyebrow="Wolbi Foundation"
        title="Community investment is not optional — it's structural."
        subtitle="The Foundation is a core division of Wolbi Royal Enterprise, not an afterthought. We invest in health, education, technology access, and youth empowerment across Ghana."
        cta={{ href: "#volunteer", label: "Volunteer with Us" }}
        cta2={{ href: "/contact", label: "Partner with the Foundation" }}
      />

      {/* About */}
      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start" }}>
          <div>
            <SectionHeading eyebrow="About the Foundation" title="Impact built into the enterprise model." />
            {[
              "Most companies treat community investment as a charity function, funded by surplus and cut when margins tighten. The Wolbi Foundation is structured differently — it receives dedicated budget and staffing as a line item, not a discretionary gesture.",
              "Our focus areas reflect the founder's lived experience: health systems that need strengthening, education that needs resourcing, young people who need pathways into technology, and communities that need the same quality of attention as any commercial client.",
              "We operate programs, run events, accept volunteers, and partner with organisations that share our values.",
            ].map((p, i) => <p key={i} style={{ color: "var(--muted)", fontSize: "16px", lineHeight: 1.8, marginBottom: "16px" }}>{p}</p>)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {[
              { icon: "🏥", title: "Health Programmes", description: "Community health awareness, screening support, and health system strengthening." },
              { icon: "📚", title: "Education", description: "Scholarships, learning resources, and institutional support for underserved communities." },
              { icon: "💡", title: "Youth & Technology", description: "Coding bootcamps, digital literacy, and mentorship for young people entering tech." },
              { icon: "🌱", title: "Community Development", description: "Grassroots projects addressing food security, livelihoods, and local infrastructure." },
            ].map((h) => (
              <Card key={h.title} style={{ padding: "22px" }}>
                <FeatureItem icon={h.icon} title={h.title} description={h.description} />
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* Dynamic programs */}
      <ProgramsSection />

      {/* Volunteer */}
      <Section id="volunteer">
        <SectionHeading eyebrow="Get Involved" title="Volunteer with the Foundation." subtitle="We welcome professionals, students, and community members who want to contribute their time and skills." center />
        <VolunteerForm />
      </Section>

      {/* CTA */}
      <FullSection style={{ background: "linear-gradient(135deg, var(--primary-dark), var(--primary))", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#fff", marginBottom: "20px" }}>Partner with us.</h2>
        <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: "32px", fontSize: "16px" }}>Organisations, NGOs, and government bodies — let's discuss what impact looks like together.</p>
        <Btn href="/contact" variant="primary">Get in Touch <ArrowRight size={14} /></Btn>
      </FullSection>
    </>
  );
}
