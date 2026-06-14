"use client";

import { useState } from "react";
import { Hero, Section, SectionHeading, Card } from "@/components/ui";
import { CheckCircle, Mail, Phone, MapPin } from "lucide-react";

const INQUIRY_TYPES = [
  { value: "GENERAL",     label: "General Inquiry" },
  { value: "TECHNOLOGY",  label: "Wolbi Technologies" },
  { value: "MEDICAL",     label: "Wolbi Medical Services" },
  { value: "VIRTUAL",     label: "Wolbi Virtual Solutions" },
  { value: "FOUNDATION",  label: "Wolbi Foundation" },
  { value: "AGRICULTURE", label: "FarmaSyst / Agriculture" },
  { value: "DEMO",        label: "Product Demo Request" },
  { value: "PARTNERSHIP", label: "Partnership" },
];


export default function ContactPage() {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", organization: "",
    inquiry_type: "GENERAL", subject: "", message: "",
  });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/leads/`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }
      );
      setStatus(res.ok ? "success" : "error");
    } catch { setStatus("error"); } finally { setLoading(false); }
  };

  const inp = {
    width: "100%", padding: "12px 14px", borderRadius: "9px",
    border: "1px solid var(--border)", background: "var(--input-bg)",
    color: "var(--foreground)", fontSize: "15px",
  };

  const label = (text) => (
    <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>{text}</label>
  );

  if (status === "success") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 2rem", textAlign: "center" }}>
      <div>
        <CheckCircle size={56} color="var(--accent)" style={{ margin: "0 auto 24px" }} />
        <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px" }}>Message received — thank you.</h2>
        <p style={{ color: "var(--muted)", fontSize: "16px", maxWidth: "460px", lineHeight: 1.7 }}>
          A member of the Wolbi team will respond within one business day.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <Hero
        eyebrow="Contact"
        title="Let's start a conversation."
        subtitle="Whether you're exploring a product, requesting a service, or looking to partner — we're listening."
        dark
      />

      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "64px", alignItems: "start" }}>
          {/* Form */}
          <div>
            <SectionHeading eyebrow="Send a Message" title="Tell us what you need." />
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  {label("Full Name *")}
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} required />
                </div>
                <div>
                  {label("Email Address *")}
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} required />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                <div>
                  {label("Phone")}
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} />
                </div>
                <div>
                  {label("Organisation")}
                  <input value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} style={inp} />
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                {label("Inquiry Type *")}
                <select value={form.inquiry_type} onChange={(e) => setForm({ ...form, inquiry_type: e.target.value })} style={inp}>
                  {INQUIRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                {label("Subject *")}
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} style={inp} required />
              </div>

              <div style={{ marginBottom: "24px" }}>
                {label("Message *")}
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={6} style={inp} required />
              </div>

              {status === "error" && (
                <p style={{ color: "#ef4444", marginBottom: "16px", fontSize: "14px" }}>
                  Something went wrong. Please try again or email us directly.
                </p>
              )}

              <button type="submit" disabled={loading} style={{
                padding: "13px 32px", background: "var(--primary)", color: "#fff",
                border: "none", borderRadius: "9px", fontSize: "16px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
              }}>
                {loading ? "Sending…" : "Send Message"}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Card style={{ padding: "24px" }}>
              <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "16px" }}>Contact Details</p>
              {[
                { icon: <Mail size={15} />, text: "mohammedawalbawahissah@gmail.com" },
                { icon: <Phone size={15} />, text: "+233 241 597 327 / +233 248 316 574 / +233 509 231 963" },
                { icon: <MapPin size={15} />, text: "Tamale, Ghana" },
              ].map(({ icon, text }) => (
                <div key={text} style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px", color: "var(--muted)", fontSize: "14px" }}>
                  <span style={{ color: "var(--accent)" }}>{icon}</span> {text}
                </div>
              ))}
            </Card>

            <Card style={{ padding: "24px" }}>
              <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "12px" }}>Response Time</p>
              <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.7 }}>
                We respond to all inquiries within one business day. For urgent matters, please indicate that in your subject line.
              </p>
            </Card>

            <Card style={{ padding: "24px" }}>
              <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "12px" }}>Looking for a demo?</p>
              <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.7, marginBottom: "14px" }}>
                Select "Product Demo Request" as your inquiry type and tell us which product interests you — NeomatCare, FarmaSyst, or MAGHAZ Assist.
              </p>
            </Card>
          </div>
        </div>
      </Section>
    </>
  );
}
