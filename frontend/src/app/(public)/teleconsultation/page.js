"use client";

import { useState, useEffect, useRef } from "react";
import { Hero, Section } from "@/components/ui";
import { CheckCircle, Clock, Video, Loader2 } from "lucide-react";
import TeleconsultationRoom from "@/components/TeleconsultationRoom";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function TeleconsultationPage() {
  const [mode, setMode] = useState("INSTANT");
  const [form, setForm] = useState({ name: "", email: "", phone: "", reason: "", scheduled_time: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [session, setSession] = useState(null); // { id, status, ... }
  const [call, setCall] = useState(null); // { room_url, token }
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/teleconsultations/request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, mode, scheduled_time: mode === "SCHEDULED" ? form.scheduled_time : null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(Object.values(data)[0]?.toString() || "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      setSession(data);
      if (mode === "INSTANT") startPolling(data.id);
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setSubmitting(false);
  };

  const startPolling = (id) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_URL}/teleconsultations/${id}/status/`);
        const data = await res.json();
        setSession((s) => ({ ...s, ...data }));
        if (data.status === "CLAIMED") {
          clearInterval(pollRef.current);
        } else if (data.status === "CANCELLED") {
          clearInterval(pollRef.current);
        }
      } catch { /* keep trying */ }
    }, 4000);
  };

  const joinCall = async () => {
    try {
      const res = await fetch(`${API_URL}/teleconsultations/${session.id}/join/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (res.ok) setCall(data);
      else setError(data.error || "Couldn't join the call.");
    } catch {
      setError("Couldn't join the call.");
    }
  };

  const inp = {
    width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid var(--border)",
    background: "var(--input-bg)", color: "var(--foreground)", fontSize: "14px",
  };

  // ── In an active video call ──────────────────────────────────────────
  if (call) {
    return (
      <div style={{ minHeight: "100vh", padding: "120px 1.5rem 60px", maxWidth: "900px", margin: "0 auto" }}>
        <TeleconsultationRoom roomUrl={call.room_url} token={call.token} onLeave={() => setCall(null)} />
      </div>
    );
  }

  // ── Waiting for staff to claim an instant request ────────────────────
  if (session && mode === "INSTANT" && session.status !== "CLAIMED") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 2rem", textAlign: "center" }}>
        <div>
          <Loader2 size={48} color="var(--accent)" style={{ margin: "0 auto 24px", display: "block", animation: "spin 1.5s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>Connecting you with our team…</h2>
          <p style={{ color: "var(--muted)", fontSize: "15px", maxWidth: "420px", margin: "0 auto" }}>
            We've notified our team. This page will update automatically the moment someone's ready — no need to refresh.
          </p>
        </div>
      </div>
    );
  }

  // ── Instant request claimed — ready to join ──────────────────────────
  if (session && session.status === "CLAIMED") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 2rem", textAlign: "center" }}>
        <div>
          <CheckCircle size={48} color="var(--accent)" style={{ margin: "0 auto 24px", display: "block" }} />
          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>Someone's ready for you</h2>
          <p style={{ color: "var(--muted)", fontSize: "15px", marginBottom: "24px" }}>A team member has joined the room. Click below to connect.</p>
          {error && <p style={{ color: "#e11d48", marginBottom: "16px" }}>{error}</p>}
          <button onClick={joinCall} style={{ padding: "14px 32px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}>
            Join Call
          </button>
        </div>
      </div>
    );
  }

  // ── Scheduled confirmation ────────────────────────────────────────────
  if (session && mode === "SCHEDULED") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 2rem", textAlign: "center" }}>
        <div>
          <CheckCircle size={56} color="var(--accent)" style={{ margin: "0 auto 24px", display: "block" }} />
          <h2 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px" }}>Consultation Requested</h2>
          <p style={{ color: "var(--muted)", fontSize: "16px", maxWidth: "460px", lineHeight: 1.7, margin: "0 auto 24px" }}>
            We'll confirm your slot by email shortly. Come back to this page at your scheduled time and refresh —
            you'll see a "Join Call" button once our team is ready.
          </p>
          <a href="/" style={{ display: "inline-block", padding: "12px 28px", background: "var(--primary)", color: "#fff", borderRadius: "8px", fontWeight: 600, textDecoration: "none" }}>Back to Home</a>
        </div>
      </div>
    );
  }

  // ── Booking form ───────────────────────────────────────────────────────
  return (
    <>
      <Hero
        eyebrow="Teleconsultation"
        title="Talk to us — right now, or on your schedule."
        subtitle="Video and text consultation with our Medical or Virtual Solutions team, wherever you are."
        dark
      />

      <Section>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
            <button
              onClick={() => setMode("INSTANT")}
              style={{
                flex: 1, padding: "16px", borderRadius: "12px", cursor: "pointer",
                border: `2px solid ${mode === "INSTANT" ? "var(--accent)" : "var(--border)"}`,
                background: "var(--card-bg)", textAlign: "left",
              }}
            >
              <Video size={20} color="var(--accent)" style={{ marginBottom: "8px" }} />
              <p style={{ fontWeight: 700, fontSize: "14px" }}>Talk Now</p>
              <p style={{ color: "var(--muted)", fontSize: "12px" }}>Connect with whoever's available</p>
            </button>
            <button
              onClick={() => setMode("SCHEDULED")}
              style={{
                flex: 1, padding: "16px", borderRadius: "12px", cursor: "pointer",
                border: `2px solid ${mode === "SCHEDULED" ? "var(--accent)" : "var(--border)"}`,
                background: "var(--card-bg)", textAlign: "left",
              }}
            >
              <Clock size={20} color="var(--accent)" style={{ marginBottom: "8px" }} />
              <p style={{ fontWeight: 700, fontSize: "14px" }}>Schedule</p>
              <p style={{ color: "var(--muted)", fontSize: "12px" }}>Book a time that works for you</p>
            </button>
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <input required placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} />
            <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} />
            <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} />
            {mode === "SCHEDULED" && (
              <input required type="datetime-local" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} style={inp} />
            )}
            <textarea
              required rows={4} placeholder="What would you like to discuss?"
              value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
              style={{ ...inp, resize: "vertical" }}
            />
            {error && <p style={{ color: "#e11d48", fontSize: "13px" }}>{error}</p>}
            <button
              type="submit" disabled={submitting}
              style={{
                padding: "14px", background: "var(--accent)", color: "#fff", border: "none",
                borderRadius: "8px", fontWeight: 700, fontSize: "15px",
                cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? "Submitting…" : mode === "INSTANT" ? "Connect Now" : "Request This Time"}
            </button>
          </form>
        </div>
      </Section>
    </>
  );
}
