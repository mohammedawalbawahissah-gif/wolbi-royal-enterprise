"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";
import TeleconsultationRoom from "@/components/TeleconsultationRoom";

const STATUS_MAP = { REQUESTED: "PENDING", CONFIRMED: "CONFIRMED", CLAIMED: "IN_PROGRESS", COMPLETED: "COMPLETED", CANCELLED: "CANCELLED", MISSED: "CANCELLED" };
const DIVISION = { MEDICAL: "Medical", VIRTUAL: "Virtual Solutions" };
const TABS = [
  ["requests", "Requests"], ["upcoming", "Upcoming"], ["live", "Live"], ["history", "History"],
];
const when = (iso) => new Date(iso).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
const toLocalInput = (iso) => { const d = new Date(iso || Date.now() + 3600000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const errMsg = (e, fallback) => e?.response?.data?.error || Object.values(e?.response?.data || {})[0]?.toString() || fallback;

function btnStyle(bg, outline) {
  return {
    padding: "8px 14px", background: bg, color: outline ? "var(--foreground)" : "#fff",
    border: outline ? "1px solid var(--border)" : "none", borderRadius: "var(--radius)",
    fontSize: "13px", cursor: "pointer",
  };
}

function TeleconsultationsContent() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [call, setCall] = useState(null);
  const [tab, setTab] = useState("requests");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(null); // { id, value, mode: "confirm" | "reschedule" }

  const load = useCallback(async () => {
    try {
      const res = await api.get("/teleconsultations/sessions/");
      setSessions(res.data.results || res.data);
    } catch { /* empty */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    api.get("/auth/profile/").then((r) => setAvailable(!!r.data.is_available_for_calls)).catch(() => {});
  }, [load]);

  // Keep the board fresh so new requests appear without a refresh
  useEffect(() => {
    if (call) return;
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [call, load]);

  const toggleAvailable = async () => {
    const next = !available;
    setAvailable(next);
    try { await api.patch("/auth/profile/update/", { is_available_for_calls: next }); }
    catch { setAvailable(!next); }
  };

  const act = async (id, action, body, success) => {
    setBusyId(id); setNotice("");
    try {
      const res = await api.post(`/teleconsultations/sessions/${id}/${action}/`, body || {});
      if (success) setNotice(success);
      await load();
      return res;
    } catch (e) {
      const d = e?.response?.data;
      if (d?.code === "too_early" && d.join_opens_at) setNotice(`Too early — the room opens ${when(d.join_opens_at)}.`);
      else setNotice(errMsg(e, "That didn't work. Please try again."));
    } finally { setBusyId(null); }
  };

  const join = async (id) => {
    const res = await act(id, "join");
    if (res) setCall(res.data);
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    const { id, value, mode } = editing;
    const iso = new Date(value).toISOString();
    const res = await act(id, mode, { scheduled_time: iso }, mode === "confirm" ? "Booking confirmed — the client has been emailed." : "Rescheduled — the client has been emailed.");
    if (res) setEditing(null);
  };

  const groups = {
    requests: sessions.filter((s) => s.status === "REQUESTED"),
    upcoming: sessions.filter((s) => s.status === "CONFIRMED").sort((a, b) => new Date(a.scheduled_time) - new Date(b.scheduled_time)),
    live: sessions.filter((s) => s.status === "CLAIMED"),
    history: sessions.filter((s) => ["COMPLETED", "CANCELLED", "MISSED"].includes(s.status)),
  };

  if (call) {
    const back = () => { setCall(null); load(); };
    return (
      <div>
        <button onClick={back} style={{ ...btnStyle("transparent", true), marginBottom: "16px" }}>← Back to sessions</button>
        <TeleconsultationRoom roomUrl={call.room_url} token={call.token} onRejoin={back} />
      </div>
    );
  }

  const card = (s) => {
    const busy = busyId === s.id;
    const scheduled = s.mode === "SCHEDULED";
    const closed = ["COMPLETED", "CANCELLED", "MISSED"].includes(s.status);
    return (
      <div key={s.id} style={{ background: "var(--card-bg)", padding: "18px 20px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", flexWrap: "wrap" }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: "15px" }}>{s.name}</p>
            <p style={{ color: "var(--muted)", fontSize: "13px" }}>{s.email}{s.phone ? ` · ${s.phone}` : ""}</p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", background: "var(--muted-bg)", padding: "2px 10px", borderRadius: "999px", color: "var(--muted)" }}>{DIVISION[s.division] || s.division}</span>
            <span style={{ fontSize: "12px", background: "var(--muted-bg)", padding: "2px 10px", borderRadius: "999px", color: "var(--muted)" }}>{scheduled ? "Scheduled" : "Instant"}</span>
            <StatusBadge status={STATUS_MAP[s.status] || s.status} />
          </div>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.5, margin: "10px 0" }}>{s.reason}</p>
        {scheduled && s.scheduled_time && (
          <p style={{ fontSize: "13px", fontWeight: 600 }}>
            {when(s.scheduled_time)} · {s.duration_minutes} min
            {s.timezone ? <span style={{ fontWeight: 400, color: "var(--muted)" }}> (client zone: {s.timezone})</span> : null}
          </p>
        )}
        {s.assigned_staff_name && <p style={{ fontSize: "12px", color: "var(--muted)" }}>Assigned to: {s.assigned_staff_name}</p>}
        {s.status === "MISSED" && <p style={{ fontSize: "12px", color: "#d97706" }}>Nobody joined</p>}
        {s.cancelled_by && s.status === "CANCELLED" && <p style={{ fontSize: "12px", color: "var(--muted)" }}>Cancelled by {s.cancelled_by}</p>}
        <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "6px" }}>Requested {new Date(s.created_at).toLocaleString()}</p>

        {editing?.id === s.id ? (
          <form onSubmit={submitEdit} style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap", alignItems: "center" }}>
            <input type="datetime-local" required value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })}
              style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "16px" }} />
            <button type="submit" disabled={busy} style={btnStyle("var(--accent)")}>{editing.mode === "confirm" ? "Confirm at this time" : "Save new time"}</button>
            <button type="button" onClick={() => setEditing(null)} style={btnStyle("transparent", true)}>Cancel</button>
          </form>
        ) : !closed && (
          <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
            {s.status === "REQUESTED" && !scheduled && (
              <button onClick={() => act(s.id, "claim")} disabled={busy} style={btnStyle("var(--accent)")}>{busy ? "Starting…" : "Accept & start room"}</button>
            )}
            {s.status === "REQUESTED" && scheduled && (
              <>
                <button onClick={() => act(s.id, "confirm", {}, "Booking confirmed — the client has been emailed.")} disabled={busy} style={btnStyle("var(--accent)")}>{busy ? "Confirming…" : "Confirm this time"}</button>
                <button onClick={() => setEditing({ id: s.id, value: toLocalInput(s.scheduled_time), mode: "confirm" })} style={btnStyle("transparent", true)}>Confirm a different time</button>
              </>
            )}
            {s.status === "CONFIRMED" && (
              <>
                <button onClick={() => join(s.id)} disabled={busy || s.join_state !== "ok"} style={{ ...btnStyle("var(--accent)"), opacity: s.join_state === "ok" ? 1 : 0.5 }}
                  title={s.join_state === "too_early" ? `Opens ${when(s.join_opens_at)}` : undefined}>
                  {s.join_state === "ok" ? (busy ? "Joining…" : "Join call") : s.join_opens_at ? `Opens ${when(s.join_opens_at)}` : "Join call"}
                </button>
                <button onClick={() => setEditing({ id: s.id, value: toLocalInput(s.scheduled_time), mode: "reschedule" })} style={btnStyle("transparent", true)}>Reschedule</button>
              </>
            )}
            {s.status === "CLAIMED" && (
              <>
                <button onClick={() => join(s.id)} disabled={busy} style={btnStyle("var(--accent)")}>{busy ? "Joining…" : "Join call"}</button>
                <button onClick={() => act(s.id, "complete")} disabled={busy} style={btnStyle("transparent", true)}>Mark completed</button>
              </>
            )}
            {s.status === "REQUESTED" && scheduled && (
              <button onClick={() => setEditing({ id: s.id, value: toLocalInput(s.scheduled_time), mode: "reschedule" })} style={btnStyle("transparent", true)}>Propose new time</button>
            )}
            <button onClick={() => window.confirm("Cancel this session? The client will be emailed.") && act(s.id, "cancel")} disabled={busy} style={btnStyle("transparent", true)}>Cancel</button>
          </div>
        )}
      </div>
    );
  };

  const list = groups[tab];
  const empty = { requests: "No requests waiting.", upcoming: "No confirmed bookings coming up.", live: "No calls in progress.", history: "No past sessions yet." }[tab];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700 }}>Teleconsultations</h1>
        <button onClick={toggleAvailable} style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "999px",
          border: `1px solid ${available ? "var(--accent)" : "var(--border)"}`, background: available ? "var(--accent)" : "transparent",
          color: available ? "#fff" : "var(--foreground)", cursor: "pointer", fontSize: "13px", fontWeight: 600,
        }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: available ? "#fff" : "var(--muted)" }} />
          {available ? "Available for instant calls" : "Not available for instant calls"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto" }}>
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: "8px 16px", borderRadius: "999px", whiteSpace: "nowrap", cursor: "pointer", fontSize: "13px", fontWeight: 600,
            border: `1px solid ${tab === key ? "var(--accent)" : "var(--border)"}`,
            background: tab === key ? "var(--accent)" : "transparent", color: tab === key ? "#fff" : "var(--foreground)",
          }}>{label} ({groups[key].length})</button>
        ))}
      </div>

      {notice && <p style={{ background: "var(--muted-bg)", padding: "10px 14px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>{notice}</p>}

      {loading ? <p style={{ color: "var(--muted)" }}>Loading…</p>
        : list.length === 0 ? <p style={{ color: "var(--muted)", fontSize: "13px" }}>{empty}</p>
        : list.map(card)}
    </div>
  );
}

export default function TeleconsultationsPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MEDICAL", "VA"]}>
      <TeleconsultationsContent />
    </ProtectedRoute>
  );
}
