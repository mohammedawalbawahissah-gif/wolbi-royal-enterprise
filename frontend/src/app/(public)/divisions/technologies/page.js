"use client";

import { useState } from "react";
import { Hero, FullSection, Section, SectionHeading, Card, Btn } from "@/components/ui";
import { ArrowRight, CheckCircle } from "lucide-react";

const SERVICES = [
  { icon: "🌐", name: "Full Stack Software Engineering", color: "#1e3a5f",
    description: "End-to-end web application development — from database architecture and API design to frontend interfaces and deployment. We build systems that scale and last.",
    features: ["Django REST Framework backends", "React & Next.js frontends", "PostgreSQL & database design", "REST & GraphQL APIs", "Cloud deployment & DevOps"] },
  { icon: "📱", name: "Mobile App Development", color: "#7c3aed",
    description: "Cross-platform mobile applications built with React Native — single codebase, native performance, deployed to both iOS and Android.",
    features: ["React Native development", "iOS & Android deployment", "Offline-first architecture", "Push notifications", "App Store & Play Store submission"] },
  { icon: "🔒", name: "Cyber Security", color: "#dc2626",
    description: "Security audits, penetration testing, and implementation of security best practices for web and mobile systems.",
    features: ["Security audits & vulnerability assessment", "Penetration testing", "OWASP compliance", "Data encryption implementation", "Security policy design"] },
  { icon: "📊", name: "Data Analysis", color: "#0ea5e9",
    description: "Transform raw data into actionable intelligence. Exploratory analysis, dashboard development, and automated reporting pipelines.",
    features: ["Exploratory data analysis", "Statistical modelling", "Dashboard development", "Automated reporting", "Python, Pandas, Power BI"] },
  { icon: "🤖", name: "Machine Learning", color: "#8b5cf6",
    description: "Practical ML solutions — classification, prediction, NLP, and computer vision — integrated into real production systems, not just notebooks.",
    features: ["Classification & regression models", "Natural Language Processing", "Computer vision", "Model deployment & monitoring", "TensorFlow, PyTorch, scikit-learn"] },
  { icon: "🔬", name: "Research Work", color: "#0f766e",
    description: "Rigorous research support for academic and clinical contexts. Mohammed's dual background makes this uniquely credible.",
    features: ["Academic research & literature review", "Clinical research support", "Data collection & analysis", "Report writing & documentation", "Statistical analysis (SPSS, R, Python)"] },
  { icon: "✨", name: "Creative Tech (AI)", color: "#ea580c",
    description: "AI-powered creative and productivity solutions — content generation, image workflows, automation, and custom GPT-based tools.",
    features: ["Custom AI tool development", "LLM integration & prompt engineering", "AI content workflows", "Automation with AI", "ChatGPT, Claude, Gemini integrations"] },
  { icon: "🧑‍💼", name: "Virtual Assistance", color: "#16a34a",
    description: "Professional virtual assistance — administrative support, research, scheduling, data entry, and business operations managed remotely.",
    features: ["Executive & admin support", "Calendar & inbox management", "Research & data compilation", "CRM management", "Business process support"] },
  { icon: "✍️", name: "Content Creation", color: "#db2777",
    description: "Strategic content creation — technical writing, blog posts, social media content, marketing copy, and multimedia production.",
    features: ["Blog & article writing", "Technical documentation", "Social media content", "Marketing copywriting", "Video scripts & multimedia"] },
];

function InquiryModal({ service, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/leads/`,
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, subject: `Service Request: ${service.name}`, inquiry_type: "TECHNOLOGY", product_interest: service.name }) }
      );
      setStatus(res.ok ? "success" : "error");
    } catch { setStatus("error"); } finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "14px" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ background: "var(--card-bg)", borderRadius: "20px", padding: "36px", maxWidth: "480px", width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <CheckCircle size={52} color="var(--accent)" style={{ margin: "0 auto 16px", display: "block" }} />
            <h3 style={{ fontWeight: 700, fontSize: "20px", marginBottom: "8px" }}>Request Received</h3>
            <p style={{ color: "var(--muted)", marginBottom: "24px" }}>Mohammed will respond within one business day.</p>
            <button onClick={onClose} style={{ padding: "10px 24px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div>
                <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: service.color, marginBottom: "4px" }}>Request Service</p>
                <h3 style={{ fontSize: "18px", fontWeight: 800 }}>{service.name}</h3>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: "22px" }}>✕</button>
            </div>
            <form onSubmit={submit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: 600 }}>Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} required />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: 600 }}>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} required />
                </div>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: 600 }}>Phone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} />
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "5px", fontSize: "13px", fontWeight: 600 }}>Tell us about your project *</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} style={inp} required placeholder="Describe what you need, your timeline, and any specific requirements..." />
              </div>
              {status === "error" && <p style={{ color: "#ef4444", marginBottom: "14px", fontSize: "13px" }}>Something went wrong. Please try again.</p>}
              <button type="submit" disabled={loading} style={{ width: "100%", padding: "12px", background: service.color, color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                {loading ? "Sending…" : "Submit Request"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function ServiceCard({ service, onRequest }) {
  return (
    <div style={{ background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
      <div style={{ height: "5px", background: service.color }} />
      <div style={{ padding: "28px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: "32px", marginBottom: "14px" }}>{service.icon}</div>
        <p style={{ fontWeight: 700, fontSize: "16px", marginBottom: "10px" }}>{service.name}</p>
        <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6, marginBottom: "16px" }}>{service.description}</p>
        <ul style={{ listStyle: "none", padding: 0, marginBottom: "20px", flex: 1 }}>
          {service.features.map((f) => (
            <li key={f} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--muted)", marginBottom: "6px" }}>
              <CheckCircle size={13} color={service.color} style={{ flexShrink: 0 }} /> {f}
            </li>
          ))}
        </ul>
        <button
          onClick={() => onRequest(service)}
          style={{ width: "100%", padding: "11px", background: service.color, color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
        >
          Request Service
        </button>
      </div>
    </div>
  );
}

export default function TechnologiesPage() {
  const [selectedService, setSelectedService] = useState(null);

  return (
    <>
      <Hero
        eyebrow="Wolbi Technologies"
        title="Software that solves real problems — not theoretical ones."
        subtitle="Full stack engineering, mobile development, AI, data science, cybersecurity, research, virtual assistance, and content creation — built with context and delivered with precision."
        cta={{ href: "/contact", label: "Request a Service" }}
        cta2={{ href: "/solutions/neomatcare", label: "See Our Products" }}
      />

      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px" }}>
          <div>
            <SectionHeading eyebrow="About" title="Technology built on operational insight." />
            {[
              "Wolbi Technologies is the engineering core of the enterprise. Every flagship product — NeomatCare, FarmaSyst, MAGHAZ Assist — was designed and built here by Mohammed Awal Bawah Issah.",
              "We work across the full stack: Django REST Framework backends, React and React Native frontends, PostgreSQL, cloud infrastructure, and AI-assisted features that are genuinely useful rather than cosmetic.",
              "Our service range extends beyond software — into data science, cybersecurity, research, virtual assistance, and content creation. Each delivered to the same professional standard.",
            ].map((p, i) => <p key={i} style={{ color: "var(--muted)", fontSize: "16px", lineHeight: 1.8, marginBottom: "16px" }}>{p}</p>)}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", alignContent: "start" }}>
            {[["9", "Services Offered"], ["3", "Flagship Products"], ["6+", "Industries"], ["100%", "Context-built"]].map(([v, l]) => (
              <Card key={l} style={{ padding: "20px", textAlign: "center" }}>
                <p style={{ fontSize: "28px", fontWeight: 800, color: "var(--primary)", marginBottom: "4px" }}>{v}</p>
                <p style={{ fontSize: "12px", color: "var(--muted)" }}>{l}</p>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      <FullSection style={{ background: "var(--muted-bg)" }}>
        <SectionHeading eyebrow="What We Offer" title="Nine services. One standard of excellence." subtitle="Click any service card to submit a request directly." center />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
          {SERVICES.map((s) => <ServiceCard key={s.name} service={s} onRequest={setSelectedService} />)}
        </div>
      </FullSection>

      <FullSection style={{ background: "linear-gradient(135deg, var(--primary-dark), var(--primary))", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#fff", marginBottom: "20px" }}>Have a project in mind?</h2>
        <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: "32px", fontSize: "16px" }}>Start with a conversation — we'll tell you honestly whether we're the right fit.</p>
        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
          <Btn href="/schedule" variant="primary">Schedule a Call <ArrowRight size={14} /></Btn>
          <Btn href="/contact" variant="ghost">Send a Message</Btn>
        </div>
      </FullSection>

      {selectedService && <InquiryModal service={selectedService} onClose={() => setSelectedService(null)} />}
    </>
  );
}
