"use client";

import { useState } from "react";
import { Hero, Section, Card } from "@/components/ui";
import { CheckCircle, Clock, Calendar, Phone, Video } from "lucide-react";

const CALL_TYPES = [
  { value: "DISCOVERY",    label: "Discovery Call",        duration: "30 mins", icon: <Phone size={18} />,    description: "A first conversation to understand your needs and see if we're the right fit." },
  { value: "TECHNICAL",    label: "Technical Consultation", duration: "60 mins", icon: <Video size={18} />,    description: "A deep-dive into a specific technical challenge, product question, or architecture review." },
  { value: "MEDICAL",      label: "Medical Advisory",       duration: "45 mins", icon: <Phone size={18} />,    description: "Discuss a health service, lab result interpretation, or health system advisory need." },
  { value: "PARTNERSHIP",  label: "Partnership Discussion",  duration: "45 mins", icon: <Video size={18} />,   description: "Explore collaboration, referral arrangements, or institutional partnerships." },
];

export default function SchedulePage() {
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", preferred_date: "", preferred_time: "", timezone: "", notes: "" });
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/leads/`,
        {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name, email: form.email, phone: form.phone,
            subject: `Schedule a Call: ${CALL_TYPES.find(c => c.value === selected)?.label}`,
            message: `Call Type: ${selected}\nPreferred Date: ${form.preferred_date}\nPreferred Time: ${form.preferred_time}\nTimezone: ${form.timezone}\n\nNotes:\n${form.notes}`,
            inquiry_type: selected === "MEDICAL" ? "MEDICAL" : "GENERAL",
          }),
        }
      );
      setStatus(res.ok ? "success" : "error");
    } catch { setStatus("error"); } finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "14px" };

  if (status === "success") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 2rem", textAlign: "center" }}>
      <div>
        <CheckCircle size={56} color="var(--accent)" style={{ margin: "0 auto 24px", display: "block" }} />
        <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px" }}>Call Request Received</h2>
        <p style={{ color: "var(--muted)", fontSize: "16px", maxWidth: "460px", lineHeight: 1.7, margin: "0 auto 24px" }}>
          Mohammed will review your request and confirm a time within one business day. Check your email for a confirmation.
        </p>
        <a href="/" style={{ display: "inline-block", padding: "12px 28px", background: "var(--primary)", color: "#fff", borderRadius: "8px", fontWeight: 600, textDecoration: "none" }}>Back to Home</a>
      </div>
    </div>
  );

  return (
    <>
      <Hero
        eyebrow="Schedule a Call"
        title="Book a call with Mohammed directly."
        subtitle="Pick a call type, share your preferred time, and we'll confirm within one business day."
        dark
      />

      <Section>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "64px", alignItems: "start" }}>

          {/* Left — call type + info */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--accent)", marginBottom: "16px" }}>Step 1 — Select Call Type</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "40px" }}>
              {CALL_TYPES.map((ct) => (
                <div
                  key={ct.value}
                  onClick={() => setSelected(ct.value)}
                  style={{
                    background: "var(--card-bg)", borderRadius: "12px", padding: "18px 20px",
                    border: `2px solid ${selected === ct.value ? "var(--accent)" : "var(--border)"}`,
                    cursor: "pointer", transition: "border-color 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: selected === ct.value ? "var(--accent)" : "var(--muted)" }}>{ct.icon}</span>
                      <p style={{ fontWeight: 700, fontSize: "15px" }}>{ct.label}</p>
                    </div>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--muted)" }}>
                      <Clock size={12} /> {ct.duration}
                    </span>
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>{ct.description}</p>
                </div>
              ))}
            </div>

            <Card style={{ padding: "24px" }}>
              <p style={{ fontWeight: 700, fontSize: "14px", marginBottom: "12px" }}>What to expect</p>
              {[
                "Submit your request below",
                "Mohammed reviews and confirms within 1 business day",
                "You receive a calendar invite with meeting link or phone number",
                "The call happens at the agreed time",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "12px", marginBottom: "10px", alignItems: "flex-start" }}>
                  <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <p style={{ fontSize: "13px", color: "var(--muted)", lineHeight: 1.5 }}>{step}</p>
                </div>
              ))}
            </Card>
          </div>

          {/* Right — form */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--accent)", marginBottom: "16px" }}>Step 2 — Your Details</p>
            <form onSubmit={submit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} required />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} required />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>Phone Number</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>Preferred Date *</label>
                  <input type="date" value={form.preferred_date} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} style={inp} required />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>Preferred Time *</label>
                  <input type="time" value={form.preferred_time} onChange={(e) => setForm({ ...form, preferred_time: e.target.value })} style={inp} required />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>Timezone</label>
                <select value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} style={inp}>
                  <option value="">Select your timezone</option>
                  <option value="GMT">GMT (Ghana / West Africa)</option>
                  <option value="WAT">WAT (West Africa Time, GMT+1)</option>
                  <option value="EAT">EAT (East Africa Time, GMT+3)</option>
                  <option value="BST">BST (UK, GMT+1)</option>
                  <option value="CET">CET (Central Europe, GMT+1)</option>
                  <option value="EST">EST (US East Coast, GMT-5)</option>
                  <option value="PST">PST (US West Coast, GMT-8)</option>
                  <option value="IST">IST (India, GMT+5:30)</option>
                </select>
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", fontWeight: 600 }}>What would you like to discuss? *</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={5} style={inp} placeholder="Briefly describe what you'd like to cover in the call..." required />
              </div>

              {!selected && <p style={{ color: "#f59e0b", fontSize: "13px", marginBottom: "14px" }}>Please select a call type above before submitting.</p>}
              {status === "error" && <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "14px" }}>Something went wrong. Please try again.</p>}

              <button
                type="submit"
                disabled={loading || !selected}
                style={{
                  width: "100%", padding: "14px", background: "var(--primary)", color: "#fff",
                  border: "none", borderRadius: "9px", fontSize: "16px", fontWeight: 600,
                  cursor: loading || !selected ? "not-allowed" : "pointer",
                  opacity: loading || !selected ? 0.6 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                <Calendar size={16} /> {loading ? "Submitting…" : "Request This Call"}
              </button>
            </form>
          </div>
        </div>
      </Section>
    </>
  );
}
