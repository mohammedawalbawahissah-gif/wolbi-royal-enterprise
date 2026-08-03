"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import TeleconsultationRoom from "@/components/TeleconsultationRoom";

function TeleconsultationsContent() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => { load(); loadProfile(); }, []);

  const load = async () => {
    try {
      const res = await api.get("/teleconsultations/sessions/");
      setSessions(res.data.results || res.data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const loadProfile = async () => {
    try {
      const res = await api.get("/auth/profile/");
      setAvailable(!!res.data.is_available_for_calls);
    } catch { /* empty */ }
  };

  const toggleAvailable = async () => {
    const next = !available;
    setAvailable(next);
    try {
      await api.patch("/auth/profile/update/", { is_available_for_calls: next });
    } catch {
      setAvailable(!next); // revert on failure
    }
  };

  const claim = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/teleconsultations/sessions/${id}/claim/`);
      await load();
    } catch {
      alert("Couldn't claim this session — it may already be taken, or video calling isn't configured yet.");
    }
    setBusyId(null);
  };

  const join = async (id) => {
    setBusyId(id);
    try {
      const res = await api.post(`/teleconsultations/sessions/${id}/join/`);
      setCall(res.data);
    } catch {
      alert("Couldn't join this call.");
    }
    setBusyId(null);
  };

  const complete = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/teleconsultations/sessions/${id}/complete/`);
      await load();
    } catch { /* empty */ }
    setBusyId(null);
  };

  const cancel = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/teleconsultations/sessions/${id}/cancel/`);
      await load();
    } catch { /* empty */ }
    setBusyId(null);
  };

  const statusMap = { REQUESTED: "PENDING", CLAIMED: "IN_PROGRESS", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED" };
  const pending = sessions.filter((s) => s.status === "REQUESTED");
  const active = sessions.filter((s) => s.status === "CLAIMED");
  const history = sessions.filter((s) => ["COMPLETED", "CANCELLED"].includes(s.status));

  if (call) {
    return (
      <div>
        <button
          onClick={() => { setCall(null); load(); }}
          style={{ marginBottom: "16px", padding: "8px 16px", background: "transparent", border: "1px solid var(--border)", borderRadius: "var(--radius)", color: "var(--foreground)", cursor: "pointer", fontSize: "13px" }}
        >
          ← Back to sessions
        </button>
        <TeleconsultationRoom roomUrl={call.room_url} token={call.token} onLeave={() => { setCall(null); load(); }} />
      </div>
    );
  }

  const SessionCard = ({ s }) => (
    <div style={{
      background: "var(--card-bg)", padding: "18px 20px", borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow)", marginBottom: "12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontWeight: 600, fontSize: "15px" }}>{s.name}</p>
          <p style={{ color: "var(--muted)", fontSize: "13px" }}>{s.email} {s.phone ? `· ${s.phone}` : ""}</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", background: "var(--muted-bg)", padding: "2px 10px", borderRadius: "999px", color: "var(--muted)" }}>
            {s.division === "MEDICAL" ? "Medical" : "Virtual Solutions"}
          </span>
          <span style={{ fontSize: "12px", background: "var(--muted-bg)", padding: "2px 10px", borderRadius: "999px", color: "var(--muted)" }}>
            {s.mode === "INSTANT" ? "Instant" : "Scheduled"}
          </span>
          <StatusBadge status={statusMap[s.status] || s.status} />
        </div>
      </div>
      <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.5, margin: "10px 0" }}>{s.reason}</p>
      {s.scheduled_time && (
        <p style={{ fontSize: "12px", color: "var(--muted)" }}>Scheduled: {new Date(s.scheduled_time).toLocaleString()}</p>
      )}
      {s.assigned_staff_name && (
        <p style={{ fontSize: "12px", color: "var(--muted)" }}>Assigned to: {s.assigned_staff_name}</p>
      )}
      <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "6px" }}>{new Date(s.created_at).toLocaleString()}</p>

      <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
        {s.status === "REQUESTED" && (
          <>
            <button onClick={() => claim(s.id)} disabled={busyId === s.id} style={btnStyle("var(--accent)")}>
              {busyId === s.id ? "Claiming…" : "Claim & Start Room"}
            </button>
            <button onClick={() => cancel(s.id)} disabled={busyId === s.id} style={btnStyle("transparent", true)}>
              Cancel
            </button>
          </>
        )}
        {s.status === "CLAIMED" && (
          <>
            <button onClick={() => join(s.id)} disabled={busyId === s.id} style={btnStyle("var(--accent)")}>
              {busyId === s.id ? "Joining…" : "Join Call"}
            </button>
            <button onClick={() => complete(s.id)} disabled={busyId === s.id} style={btnStyle("transparent", true)}>
              Mark Completed
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700 }}>Teleconsultations</h1>
        <button
          onClick={toggleAvailable}
          style={{
            display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px",
            borderRadius: "999px", border: `1px solid ${available ? "var(--accent)" : "var(--border)"}`,
            background: available ? "var(--accent)" : "transparent",
            color: available ? "#fff" : "var(--foreground)", cursor: "pointer", fontSize: "13px", fontWeight: 600,
          }}
        >
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: available ? "#fff" : "var(--muted)" }} />
          {available ? "Available for instant calls" : "Not available for instant calls"}
        </button>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading…</p>
      ) : (
        <>
          <h2 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>Awaiting a team member ({pending.length})</h2>
          {pending.length === 0 ? <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "24px" }}>Nothing pending.</p> : pending.map((s) => <SessionCard key={s.id} s={s} />)}

          <h2 style={{ fontSize: "15px", fontWeight: 700, margin: "24px 0 12px" }}>Active ({active.length})</h2>
          {active.length === 0 ? <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "24px" }}>No active sessions.</p> : active.map((s) => <SessionCard key={s.id} s={s} />)}

          <h2 style={{ fontSize: "15px", fontWeight: 700, margin: "24px 0 12px" }}>History ({history.length})</h2>
          {history.length === 0 ? <p style={{ color: "var(--muted)", fontSize: "13px" }}>No past sessions yet.</p> : history.map((s) => <SessionCard key={s.id} s={s} />)}
        </>
      )}
    </div>
  );
}

function btnStyle(bg, outline) {
  return {
    padding: "6px 14px", background: bg, color: outline ? "var(--foreground)" : "#fff",
    border: outline ? "1px solid var(--border)" : "none", borderRadius: "var(--radius)",
    fontSize: "13px", cursor: "pointer",
  };
}

export default function TeleconsultationsPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MEDICAL", "VA"]}>
      <TeleconsultationsContent />
    </ProtectedRoute>
  );
}
