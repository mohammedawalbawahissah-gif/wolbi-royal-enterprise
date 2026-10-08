"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Hero, Section } from "@/components/ui";
import { CheckCircle, Clock, Video, Loader2, CalendarClock } from "lucide-react";
import TeleconsultationRoom from "@/components/TeleconsultationRoom";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const OPEN = ["REQUESTED", "CONFIRMED", "CLAIMED"];
const DURATIONS = [15, 30, 45, 60];

const fmt = (iso, tz) => {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit",
      timeZone: tz || undefined, timeZoneName: "short",
    }).format(new Date(iso));
  } catch { return new Date(iso).toLocaleString(); }
};

const countdown = (ms) => {
  if (ms <= 0) return "now";
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d >= 1) return `${d} day${d > 1 ? "s" : ""} ${h % 24}h`;
  if (h >= 1) return `${h}h ${m % 60}m`;
  return `${Math.max(m, 1)} min`;
};

const toIso = (local) => (local ? new Date(local).toISOString() : null);
const firstError = (data) => {
  const v = data && typeof data === "object" ? Object.values(data)[0] : null;
  return (Array.isArray(v) ? v[0] : v)?.toString() || "Something went wrong. Please try again.";
};

const page = { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px 1.5rem", textAlign: "center" };
const primary = { padding: "14px 32px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "15px", cursor: "pointer" };
const ghost = { padding: "12px 24px", background: "transparent", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: "8px", fontWeight: 600, fontSize: "14px", cursor: "pointer" };
const inp = { width: "100%", padding: "11px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "16px" };

export default function TeleconsultationPage() {
  const [mode, setMode] = useState("INSTANT");
  const [form, setForm] = useState({ name: "", email: "", phone: "", reason: "", scheduled_time: "", duration_minutes: 30 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [creds, setCreds] = useState(null);       // { id, token }
  const [session, setSession] = useState(null);   // status payload
  const [call, setCall] = useState(null);         // { room_url, token }
  const [joining, setJoining] = useState(false);
  const [changing, setChanging] = useState(false);
  const [newTime, setNewTime] = useState("");
  const [now, setNow] = useState(Date.now());
  const [skew, setSkew] = useState(0);            // server clock - local clock
  const [waitedMs, setWaitedMs] = useState(0);
  const waitStart = useRef(Date.now());
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";

  const fetchStatus = useCallback(async (c) => {
    const res = await fetch(`${API_URL}/teleconsultations/${c.id}/status/?token=${encodeURIComponent(c.token)}`);
    if (!res.ok) throw new Error("not found");
    const data = await res.json();
    if (data.server_time) setSkew(new Date(data.server_time).getTime() - Date.now());
    setSession(data);
    return data;
  }, []);

  // Back from an email link: /teleconsultation?session=12&token=abc
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const id = p.get("session"), token = p.get("token");
    if (!id || !token) return;
    const c = { id, token };
    setCreds(c);
    fetchStatus(c).then((d) => setMode(d.mode)).catch(() => {
      setCreds(null);
      setError("We couldn't find that booking. The link may be incomplete — please book again below.");
    });
  }, [fetchStatus]);

  // Poll while a session is open and we are not in the video call
  const polling = creds && !call && (!session || OPEN.includes(session.status));
  useEffect(() => {
    if (!polling) return;
    const t = setInterval(() => { fetchStatus(creds).catch(() => {}); }, 5000);
    return () => clearInterval(t);
  }, [polling, creds, fetchStatus]);

  // Tick for countdowns / wait timer
  useEffect(() => {
    if (!creds) return;
    const t = setInterval(() => { setNow(Date.now()); setWaitedMs(Date.now() - waitStart.current); }, 1000);
    return () => clearInterval(t);
  }, [creds]);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`${API_URL}/teleconsultations/request/`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone, reason: form.reason, mode,
          timezone: tz || undefined,
          ...(mode === "SCHEDULED" ? { scheduled_time: toIso(form.scheduled_time), duration_minutes: Number(form.duration_minutes) } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(firstError(data)); setSubmitting(false); return; }
      const c = { id: data.id, token: data.access_token };
      waitStart.current = Date.now();
      setCreds(c);
      window.history.replaceState(null, "", `?session=${c.id}&token=${encodeURIComponent(c.token)}`);
      await fetchStatus(c).catch(() => {});
    } catch { setError("Something went wrong. Please try again."); }
    setSubmitting(false);
  };

  const post = async (path, body = {}) => {
    const res = await fetch(`${API_URL}/teleconsultations/${creds.id}/${path}/`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: creds.token, ...body }),
    });
    let data = {}; try { data = await res.json(); } catch {}
    return { ok: res.ok, data };
  };

  const joinCall = async () => {
    setJoining(true); setError("");
    const { ok, data } = await post("join");
    if (ok) setCall(data); else { setError(data.error || "Couldn't join the call."); fetchStatus(creds).catch(() => {}); }
    setJoining(false);
  };

  const cancel = async () => {
    if (!window.confirm("Cancel this teleconsultation?")) return;
    const { ok, data } = await post("cancel");
    if (ok) setSession(data); else setError(data.error || "Couldn't cancel.");
  };

  const reschedule = async (e) => {
    e?.preventDefault();
    setError("");
    const { ok, data } = await post("reschedule", { scheduled_time: toIso(newTime) });
    if (ok) { setSession(data); setMode("SCHEDULED"); setChanging(false); setNewTime(""); }
    else setError(firstError(data.scheduled_time ? data : { e: data.error }));
  };

  const reset = () => {
    window.history.replaceState(null, "", window.location.pathname);
    setCreds(null); setSession(null); setCall(null); setError(""); setChanging(false);
  };

  // ── In the video call ──────────────────────────────────────────────
  if (call) {
    return (
      <div style={{ minHeight: "100vh", padding: "100px 1rem 40px", maxWidth: "960px", margin: "0 auto" }}>
        <TeleconsultationRoom roomUrl={call.room_url} token={call.token}
          onRejoin={() => { setCall(null); fetchStatus(creds).catch(() => {}); }} />
      </div>
    );
  }

  // ── Existing session views ─────────────────────────────────────────
  if (creds && !session) {
    return <div style={page}><Loader2 size={40} color="var(--accent)" style={{ animation: "spin 1.5s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;
  }

  if (creds && session) {
    const s = session;
    const scheduled = s.mode === "SCHEDULED";
    const t = scheduled ? new Date(s.scheduled_time).getTime() : 0;
    const serverNow = now + skew;
    const canJoin = s.join_state === "ok" ||
      (scheduled && s.join_opens_at && serverNow >= new Date(s.join_opens_at).getTime() && ["CONFIRMED", "CLAIMED"].includes(s.status) && s.join_state !== "ended");
    const spinStyle = <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>;

    const errLine = error && <p style={{ color: "#e11d48", fontSize: "14px", margin: "0 0 16px" }}>{error}</p>;

    const changeForm = changing && (
      <form onSubmit={reschedule} style={{ margin: "20px auto 0", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <label style={{ fontSize: "13px", color: "var(--muted)", textAlign: "left" }}>Choose a new time ({tz})</label>
        <input required type="datetime-local" value={newTime} onChange={(e) => setNewTime(e.target.value)} style={inp} />
        <button type="submit" style={primary}>Request this time</button>
        <button type="button" onClick={() => setChanging(false)} style={ghost}>Never mind</button>
      </form>
    );

    if (["COMPLETED", "CANCELLED", "MISSED"].includes(s.status)) {
      const msg = {
        COMPLETED: ["This session has ended", "Thank you for speaking with us. Reply to your confirmation email if you have follow-up questions."],
        CANCELLED: ["This session was cancelled", "You're welcome to book a new session any time."],
        MISSED: ["We missed each other", "The session time passed before the call took place. You can book a new time."],
      }[s.status];
      return (
        <div style={page}><div>
          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>{msg[0]}</h2>
          <p style={{ color: "var(--muted)", fontSize: "15px", maxWidth: "420px", margin: "0 auto 24px" }}>{msg[1]}</p>
          <button onClick={reset} style={primary}>Book a new session</button>
        </div></div>
      );
    }

    // Instant, nobody yet
    if (!scheduled && s.status === "REQUESTED") {
      const longWait = waitedMs > 120000;
      return (
        <div style={page}><div style={{ maxWidth: "460px" }}>
          <Loader2 size={48} color="var(--accent)" style={{ margin: "0 auto 24px", display: "block", animation: "spin 1.5s linear infinite" }} />{spinStyle}
          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>Connecting you with our team…</h2>
          <p style={{ color: "var(--muted)", fontSize: "15px", marginBottom: "20px" }}>
            Keep this page open — it will update the moment someone is ready. We&apos;ve also emailed you a link back to this page.
          </p>
          {errLine}
          {longWait && !changing && (
            <div style={{ marginTop: "8px" }}>
              <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "12px" }}>Taking a while? Pick a time that suits you instead and we&apos;ll confirm it.</p>
              <button onClick={() => setChanging(true)} style={ghost}><CalendarClock size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />Schedule for later</button>
            </div>
          )}
          {changeForm}
          <p style={{ marginTop: "24px" }}><button onClick={cancel} style={{ ...ghost, border: "none", color: "var(--muted)", textDecoration: "underline" }}>Cancel request</button></p>
        </div></div>
      );
    }

    // Instant, accepted
    if (!scheduled && s.status === "CLAIMED") {
      return (
        <div style={page}><div>
          <CheckCircle size={48} color="var(--accent)" style={{ margin: "0 auto 24px", display: "block" }} />
          <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "12px" }}>Someone&apos;s ready for you</h2>
          <p style={{ color: "var(--muted)", fontSize: "15px", marginBottom: "24px" }}>A team member is in the room. Allow camera and microphone access when asked.</p>
          {errLine}
          <button onClick={joinCall} disabled={joining} style={{ ...primary, opacity: joining ? 0.7 : 1 }}>{joining ? "Connecting…" : "Join call"}</button>
        </div></div>
      );
    }

    // Scheduled
    const confirmed = ["CONFIRMED", "CLAIMED"].includes(s.status);
    return (
      <div style={page}><div style={{ maxWidth: "520px", width: "100%" }}>
        {confirmed ? <CheckCircle size={52} color="var(--accent)" style={{ margin: "0 auto 20px", display: "block" }} />
                   : <Clock size={52} color="var(--accent)" style={{ margin: "0 auto 20px", display: "block" }} />}
        <h2 style={{ fontSize: "26px", fontWeight: 800, marginBottom: "8px" }}>{confirmed ? "Your teleconsultation is confirmed" : "Request received — awaiting confirmation"}</h2>
        <p style={{ fontSize: "17px", fontWeight: 600, marginBottom: "4px" }}>{fmt(s.scheduled_time, tz)}</p>
        <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px" }}>
          {s.duration_minutes} minutes{confirmed && t > serverNow ? ` · starts in ${countdown(t - serverNow)}` : ""}
        </p>
        {!confirmed && <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px" }}>A team member will confirm shortly and we&apos;ll email you. This page updates automatically.</p>}
        {confirmed && !canJoin && s.join_opens_at && (
          <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "16px" }}>The room opens at {new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(s.join_opens_at))}. Come back to this page then — we&apos;ll also send a reminder.</p>
        )}
        {errLine}
        {confirmed && (
          <button onClick={joinCall} disabled={!canJoin || joining} style={{ ...primary, opacity: !canJoin || joining ? 0.5 : 1, cursor: canJoin ? "pointer" : "not-allowed", marginBottom: "16px" }}>
            <Video size={16} style={{ verticalAlign: "-3px", marginRight: 8 }} />{joining ? "Connecting…" : canJoin ? "Join call" : "Join (opens soon)"}
          </button>
        )}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          {!changing && <button onClick={() => setChanging(true)} style={ghost}>Change time</button>}
          <button onClick={cancel} style={ghost}>Cancel booking</button>
        </div>
        {changeForm}
        {changing && confirmed && <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "10px" }}>A new time needs to be confirmed by our team again.</p>}
      </div></div>
    );
  }

  // ── Booking form ───────────────────────────────────────────────────
  const minLocal = (() => { const d = new Date(Date.now() + 31 * 60000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); })();
  const tab = (active) => ({ flex: 1, padding: "16px", borderRadius: "12px", cursor: "pointer", border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`, background: "var(--card-bg)", textAlign: "left", color: "var(--foreground)" });

  return (
    <>
      <Hero eyebrow="Teleconsultation" title="Talk to us — right now, or on your schedule."
        subtitle="Video consultation with our Medical or Virtual Solutions team, wherever you are." dark />
      <Section>
        <div style={{ maxWidth: "560px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "12px", marginBottom: "28px" }}>
            <button type="button" onClick={() => setMode("INSTANT")} style={tab(mode === "INSTANT")}>
              <Video size={20} color="var(--accent)" style={{ marginBottom: "8px" }} />
              <p style={{ fontWeight: 700, fontSize: "14px" }}>Talk Now</p>
              <p style={{ color: "var(--muted)", fontSize: "12px" }}>Connect with whoever&apos;s available</p>
            </button>
            <button type="button" onClick={() => setMode("SCHEDULED")} style={tab(mode === "SCHEDULED")}>
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
              <>
                <label style={{ fontSize: "13px", color: "var(--muted)" }}>Preferred date &amp; time {tz && `(your time zone: ${tz})`}</label>
                <input required type="datetime-local" min={minLocal} value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} style={inp} />
                <select value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} style={inp} aria-label="Length">
                  {DURATIONS.map((d) => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </>
            )}
            <textarea required rows={4} placeholder="What would you like to discuss?" value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })} style={{ ...inp, resize: "vertical" }} />
            {error && <p style={{ color: "#e11d48", fontSize: "13px" }}>{error}</p>}
            <button type="submit" disabled={submitting} style={{ ...primary, opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Submitting…" : mode === "INSTANT" ? "Connect Now" : "Request This Time"}
            </button>
          </form>
        </div>
      </Section>
    </>
  );
}
