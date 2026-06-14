"use client";

import { useState } from "react";
import { Hero, FullSection, Section, SectionHeading, Card, Btn, FeatureItem, Tag } from "@/components/ui";
import { ArrowRight, CheckCircle } from "lucide-react";

function DemoForm({ productName }) {
  const [form, setForm] = useState({ name: "", email: "", organization: "", message: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/leads/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subject: `Demo Request: ${productName}`, inquiry_type: "DEMO", product_interest: productName }),
      });
      setStatus(res.ok ? "success" : "error");
    } catch { setStatus("error"); } finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "14px" };

  if (status === "success") return (
    <div style={{ textAlign: "center", padding: "32px" }}>
      <CheckCircle size={40} color="var(--accent)" style={{ margin: "0 auto 16px" }} />
      <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>Demo request sent.</p>
      <p style={{ color: "var(--muted)" }}>We'll be in touch within one business day.</p>
    </div>
  );

  return (
    <form onSubmit={submit}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
        {[{ label: "Full Name", key: "name", type: "text" }, { label: "Email Address", key: "email", type: "email" }].map(({ label, key, type }) => (
          <div key={key}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 500 }}>{label}</label>
            <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} style={inp} required />
          </div>
        ))}
      </div>
      <div style={{ marginBottom: "14px" }}>
        <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 500 }}>Organisation</label>
        <input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} style={inp} />
      </div>
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 500 }}>What would you like to see in the demo?</label>
        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} style={inp} />
      </div>
      {status === "error" && <p style={{ color: "#ef4444", marginBottom: "14px", fontSize: "13px" }}>Something went wrong. Please try again.</p>}
      <button type="submit" disabled={loading} style={{ padding: "12px 28px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
        {loading ? "Sending…" : "Request Demo"}
      </button>
    </form>
  );
}

export default function ProductPage({ name, industry, color, hero, overview, features, targetUsers, roadmap }) {
  return (
    <>
      <Hero {...hero} />

      {/* Overview */}
      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start" }}>
          <div>
            <Tag color={color}>{industry}</Tag>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 800, margin: "16px 0 20px", letterSpacing: "-0.5px" }}>{overview.title}</h2>
            {overview.paragraphs.map((p, i) => (
              <p key={i} style={{ color: "var(--muted)", fontSize: "16px", lineHeight: 1.8, marginBottom: "16px" }}>{p}</p>
            ))}
            {targetUsers && (
              <div style={{ marginTop: "24px" }}>
                <p style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--muted)", marginBottom: "12px" }}>Built for</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {targetUsers.map((u) => <Tag key={u} color={color}>{u}</Tag>)}
                </div>
              </div>
            )}
          </div>
          <Card style={{ padding: "36px", borderTop: `4px solid ${color}` }}>
            <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color, marginBottom: "20px" }}>Request a Demo</p>
            <DemoForm productName={name} />
          </Card>
        </div>
      </Section>

      {/* Features */}
      {features && (
        <FullSection style={{ background: "var(--muted-bg)" }}>
          <SectionHeading eyebrow="Features" title={`What ${name} does.`} center />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
            {features.map((f) => (
              <Card key={f.title}>
                <FeatureItem icon={f.icon} title={f.title} description={f.description} />
              </Card>
            ))}
          </div>
        </FullSection>
      )}

      {/* Roadmap */}
      {roadmap && (
        <Section>
          <SectionHeading eyebrow="Roadmap" title="Where we're heading." />
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "640px" }}>
            {roadmap.map((item) => (
              <div key={item.title} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: item.done ? "var(--accent)" : "var(--border)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: "2px" }}>
                  {item.done && <CheckCircle size={14} color="#fff" />}
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "3px", opacity: item.done ? 1 : 0.65 }}>{item.title}</p>
                  <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.6 }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <FullSection style={{ background: "linear-gradient(135deg, var(--primary-dark), var(--primary))", textAlign: "center" }}>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#fff", marginBottom: "20px" }}>Ready to get started with {name}?</h2>
        <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
          <Btn href="/contact" variant="primary">Contact Us <ArrowRight size={14} /></Btn>
          <Btn href="/solutions" variant="ghost">View All Products</Btn>
        </div>
      </FullSection>
    </>
  );
}
