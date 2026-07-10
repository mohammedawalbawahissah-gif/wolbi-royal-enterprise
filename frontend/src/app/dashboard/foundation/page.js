"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

function VolunteerCard({ volunteer }) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const suggest = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/foundation/volunteers/${volunteer.id}/suggest-program/`);
      setSuggestions(res.data.suggestions || []);
    } catch {
      setError("AI matching isn't available right now.");
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "var(--card-bg)", padding: "18px 20px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)" }}>
      <p style={{ fontWeight: 600, fontSize: "14px" }}>{volunteer.name}</p>
      <p style={{ color: "var(--muted)", fontSize: "13px" }}>{volunteer.email}{volunteer.phone ? ` · ${volunteer.phone}` : ""}</p>
      <p style={{ fontSize: "13px", marginTop: "8px", lineHeight: 1.6 }}>{volunteer.interest}</p>

      <button
        onClick={suggest}
        disabled={loading}
        style={{ marginTop: "10px", padding: "6px 14px", background: "transparent", border: "1px solid var(--border)", color: "var(--foreground)", borderRadius: "var(--radius)", fontSize: "12px", cursor: "pointer" }}
      >
        {loading ? "Matching…" : "🤖 Suggest best-fit program"}
      </button>

      {error && <p style={{ color: "#e11d48", fontSize: "12px", marginTop: "6px" }}>{error}</p>}
      {suggestions && suggestions.length === 0 && (
        <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "6px" }}>No strong match found among active programs.</p>
      )}
      {suggestions && suggestions.length > 0 && (
        <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
          {suggestions.map((s) => (
            <div key={s.program_id} style={{ padding: "8px 12px", background: "var(--muted-bg)", borderRadius: "var(--radius)", fontSize: "12px" }}>
              Program #{s.program_id} — {s.reason}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FoundationDashboard() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/foundation/volunteers/list/")
      .then((r) => setVolunteers(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute allowedRoles={["FOUNDATION"]}>
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Foundation Hub</h1>
        <p style={{ color: "var(--muted)", marginBottom: "28px" }}>Wolbi Foundation — community programs, volunteers, and impact tracking.</p>

        <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "14px" }}>Volunteer Applications</h2>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : volunteers.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No volunteer applications yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {volunteers.map((v) => <VolunteerCard key={v.id} volunteer={v} />)}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
