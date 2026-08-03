"use client";

import { useState } from "react";
import { Hero, FullSection, Section, SectionHeading, Card, Btn } from "@/components/ui";
import { ArrowRight, CheckCircle } from "lucide-react";

const PARTNERSHIP_TYPES = [
  {
    icon: "🏥",
    title: "Healthcare Partners",
    description: "Hospitals, clinics, diagnostic labs, and health NGOs working alongside Wolbi Medical Services and NeomatCare.",
    examples: ["Referral network partners", "Laboratory equipment suppliers", "Health NGOs and development partners", "MOH and government health bodies"],
  },
  {
    icon: "🌾",
    title: "Agritech & Financial Partners",
    description: "Agricultural lenders, input suppliers, commodity buyers, and cooperative organisations partnering with FarmaSyst.",
    examples: ["Microfinance institutions", "Agricultural input suppliers", "Commodity offtakers", "Farmer cooperatives"],
  },
  {
    icon: "💻",
    title: "Technology Partners",
    description: "Software companies, cloud providers, and technology organisations collaborating with Wolbi Technologies.",
    examples: ["Cloud infrastructure providers", "SaaS integrations", "Developer communities", "Research institutions"],
  },
  {
    icon: "🤝",
    title: "Community & Foundation Partners",
    description: "NGOs, government bodies, educational institutions, and donor organisations supporting the Wolbi Foundation's programmes.",
    examples: ["Educational institutions", "Youth organisations", "Donor agencies", "Community development NGOs"],
  },
];

function PartnershipForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", organization: "", partnership_type: "", message: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/leads/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            organization: form.organization,
            subject: `Partnership Inquiry: ${form.partnership_type || "General"}`,
            message: `Partnership Type: ${form.partnership_type}\n\n${form.message}`,
            inquiry_type: "PARTNERSHIP",
          }),
        }
      );
      setStatus(res.ok ? "success" : "error");
    } catch { setStatus("error"); } finally { setLoading(false); }
  };

  const inp = {
    width: "100%", padding: "11px 14px", borderRadius: "8px",
    border: "1px solid var(--border)", background: "var(--input-bg)",
    color: "var(--foreground)", fontSize: "14px",
  };

  if (status === "success") return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <CheckCircle size={48} color="var(--accent)" style={{ margin: "0 auto 20px", display: "block" }} />
      <h3 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "10px" }}>Partnership Request Received</h3>
      <p style={{ color: "var(--muted)", fontSize: "16px", maxWidth: "440px", margin: "0 auto" }}>
        Mohammed will review your proposal and respond within two business days.
      </p>
    </div>
  );

  return (
    <form onSubmit={submit} style={{ maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        {[{ label: "Full Name *", key: "name", type: "text" }, { label: "Email Address *", key: "email", type: "email" }].map(({ label, key, type }) => (
          <div key={key}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>{label}</label>
            <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={inp} required />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Phone</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} />
        </div>
        <div>
          <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Organisation *</label>
          <input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} style={inp} required />
        </div>
      </div>
      <div style={{ marginBottom: "16px" }}>
        <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Partnership Type</label>
        <select value={form.partnership_type} onChange={(e) => setForm({ ...form, partnership_type: e.target.value })} style={inp}>
          <option value="">Select a category</option>
          <option value="Healthcare">Healthcare Partner</option>
          <option value="Agritech / Financial">Agritech / Financial Partner</option>
          <option value="Technology">Technology Partner</option>
          <option value="Community / Foundation">Community / Foundation Partner</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div style={{ marginBottom: "24px" }}>
        <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Tell us about the partnership *</label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={5} style={inp} required
          placeholder="Describe your organisation, what you do, and how you see us working together..."
        />
      </div>
      {status === "error" && <p style={{ color: "#ef4444", marginBottom: "16px", fontSize: "13px" }}>Something went wrong. Please try again.</p>}
      <button
        type="submit" disabled={loading}
        style={{ padding: "13px 32px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "9px", fontSize: "16px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
      >
        {loading ? "Sending…" : "Submit Partnership Proposal"}
      </button>
    </form>
  );
}

export default function PartnersPage() {
  return (
    <>
      <Hero
        eyebrow="Partners"
        title="Building Africa's future is not a solo endeavour."
        subtitle="Wolbi Royal Enterprise is open to partnerships across healthcare, agritech, technology, and community development. If your mission aligns with ours, let's talk."
        cta={{ href: "#partner-form", label: "Become a Partner" }}
        cta2={{ href: "/contact", label: "General Inquiry" }}
      />

      {/* Current partners placeholder */}
      <Section>
        <SectionHeading
          eyebrow="Our Partners"
          title="Partnerships coming soon."
          subtitle="We are building our formal partner network. If you're interested in partnering with Wolbi Royal Enterprise, apply below and we'll be in touch."
        />
        <div style={{
          border: "2px dashed var(--border)", borderRadius: "16px", padding: "64px 32px",
          textAlign: "center", color: "var(--muted)",
        }}>
          <p style={{ fontSize: "40px", marginBottom: "16px" }}>🤝</p>
          <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px", color: "var(--foreground)" }}>
            Partner logos will appear here
          </p>
          <p style={{ fontSize: "15px", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto" }}>
            Once partnerships are formalised, this section will display partner organisations with their logos, names, and areas of collaboration.
          </p>
        </div>
      </Section>

      {/* Partnership types */}
      <FullSection style={{ background: "var(--muted-bg)" }}>
        <SectionHeading eyebrow="Partnership Categories" title="How we partner." center />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {PARTNERSHIP_TYPES.map((pt) => (
            <Card key={pt.title}>
              <div style={{ fontSize: "32px", marginBottom: "14px" }}>{pt.icon}</div>
              <p style={{ fontWeight: 700, fontSize: "16px", marginBottom: "10px" }}>{pt.title}</p>
              <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6, marginBottom: "16px" }}>{pt.description}</p>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {pt.examples.map((ex) => (
                  <li key={ex} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--muted)", marginBottom: "6px" }}>
                    <CheckCircle size={12} color="var(--accent)" style={{ flexShrink: 0 }} /> {ex}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </FullSection>

      {/* What we offer partners */}
      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "center" }}>
          <div>
            <SectionHeading eyebrow="Why Partner with Wolbi" title="What you get from a Wolbi partnership." />
            {[
              "Access to a multi-division organisation with capabilities in technology, healthcare, agriculture, and community development — all under one roof.",
              "A partner who builds from lived experience inside the sectors we serve. Mohammed's dual background means partnerships with Wolbi carry operational credibility that purely commercial technology firms cannot offer.",
              "Co-development opportunities — where relevant, Wolbi is open to building shared products, services, or programmes with strategic partners.",
              "A long-term relationship model. We don't do transactional partnerships. If we work together, we're committed to making it count.",
            ].map((p, i) => (
              <p key={i} style={{ color: "var(--muted)", fontSize: "16px", lineHeight: 1.8, marginBottom: "16px" }}>{p}</p>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {[
              { icon: "🌍", title: "Pan-African reach",      text: "Based in Ghana, with products and services serving clients across Africa." },
              { icon: "🔬", title: "Sector credibility",     text: "Medical, agricultural, and technology expertise in one organisation." },
              { icon: "🏗️", title: "Build together",         text: "Open to co-building products, platforms, and programmes with aligned partners." },
              { icon: "📈", title: "Growth alignment",       text: "We grow when our partners grow — that's how we structure every relationship." },
            ].map(({ icon, title, text }) => (
              <Card key={title} style={{ padding: "20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "22px" }}>{icon}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>{title}</p>
                  <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>{text}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* Partner application form */}
      <FullSection style={{ background: "var(--muted-bg)" }} id="partner-form">
        <SectionHeading
          eyebrow="Become a Partner"
          title="Apply to partner with Wolbi Royal Enterprise."
          subtitle="Fill in the form below and Mohammed will review your proposal personally."
          center
        />
        <PartnershipForm />
      </FullSection>

      {/* CTA */}
      <FullSection style={{ background: "linear-gradient(135deg, var(--primary-dark), var(--primary))", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#fff", marginBottom: "16px" }}>
          Have questions before applying?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "16px", marginBottom: "32px" }}>
          Schedule a discovery call or send us a message — we're happy to talk through what a partnership could look like.
        </p>
        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
          <Btn href="/schedule" variant="primary">Schedule a Call <ArrowRight size={14} /></Btn>
          <Btn href="/contact" variant="ghost">Contact Us</Btn>
        </div>
      </FullSection>
    </>
  );
}
