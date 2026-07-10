"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";

function LeadsContent() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => { loadLeads(); }, []);

  const loadLeads = async () => {
    try {
      const res = await api.get("/leads/");
      setLeads(res.data.results || res.data);
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const markContacted = async (id) => {
    await api.post(`/leads/${id}/mark_contacted/`);
    loadLeads();
  };

  const [retriaging, setRetriaging] = useState(null);
  const retriage = async (id) => {
    setRetriaging(id);
    try {
      await api.post(`/leads/${id}/ai_retriage/`);
      await loadLeads();
    } catch { /* AI not configured or temporarily unavailable */ }
    setRetriaging(null);
  };

  const priorityColor = { HIGH: "#e11d48", MEDIUM: "#f59e0b", LOW: "var(--muted)" };

  const filtered = filter === "ALL"
    ? leads
    : filter === "NEW"
    ? leads.filter((l) => !l.is_contacted)
    : leads.filter((l) => l.inquiry_type === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700 }}>Leads</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--foreground)" }}
        >
          <option value="ALL">All Leads</option>
          <option value="NEW">New / Uncontacted</option>
          <option value="GENERAL">General</option>
          <option value="TECHNOLOGY">Technology</option>
          <option value="MEDICAL">Medical</option>
          <option value="VIRTUAL">Virtual Solutions</option>
          <option value="AGRICULTURE">Agriculture</option>
          <option value="DEMO">Demo Request</option>
          <option value="PARTNERSHIP">Partnership</option>
        </select>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading leads…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No leads found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((lead) => (
            <div key={lead.id} style={{
              background: "var(--card-bg)", padding: "20px", borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow)", borderLeft: lead.is_contacted ? "4px solid var(--accent)" : "4px solid #f59e0b",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "15px" }}>{lead.name}</p>
                  <p style={{ color: "var(--muted)", fontSize: "13px" }}>{lead.email} {lead.phone ? `· ${lead.phone}` : ""}</p>
                  {lead.organization && <p style={{ color: "var(--muted)", fontSize: "13px" }}>{lead.organization}</p>}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {lead.ai_priority && (
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", background: priorityColor[lead.ai_priority], padding: "2px 10px", borderRadius: "999px" }}>
                      AI: {lead.ai_priority}
                    </span>
                  )}
                  <span style={{ fontSize: "12px", background: "var(--muted-bg)", padding: "2px 10px", borderRadius: "999px", color: "var(--muted)" }}>
                    {lead.inquiry_type}
                  </span>
                  <StatusBadge status={lead.is_contacted ? "COMPLETED" : "PENDING"} />
                </div>
              </div>
              <p style={{ margin: "10px 0 4px", fontWeight: 500, fontSize: "14px" }}>{lead.subject}</p>
              <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>{lead.message}</p>

              {(lead.ai_summary || lead.ai_possible_duplicate || lead.ai_suggested_type) && (
                <div style={{ marginTop: "10px", padding: "10px 12px", background: "var(--muted-bg)", borderRadius: "var(--radius)", fontSize: "13px" }}>
                  {lead.ai_summary && <p style={{ marginBottom: "4px" }}>🤖 {lead.ai_summary}</p>}
                  {lead.ai_possible_duplicate && (
                    <p style={{ color: "#e11d48", fontWeight: 600 }}>⚠ Possibly a repeat inquiry from this person</p>
                  )}
                  {lead.ai_suggested_type && lead.ai_suggested_type !== lead.inquiry_type && (
                    <p style={{ color: "var(--muted)" }}>AI suggests category: <strong>{lead.ai_suggested_type}</strong></p>
                  )}
                </div>
              )}

              <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "10px" }}>
                {new Date(lead.created_at).toLocaleString()}
              </p>
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                {!lead.is_contacted && (
                  <button
                    onClick={() => markContacted(lead.id)}
                    style={{
                      padding: "6px 14px", background: "var(--accent)",
                      color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "13px", cursor: "pointer",
                    }}
                  >
                    Mark Contacted
                  </button>
                )}
                <button
                  onClick={() => retriage(lead.id)}
                  disabled={retriaging === lead.id}
                  style={{
                    padding: "6px 14px", background: "transparent", border: "1px solid var(--border)",
                    color: "var(--foreground)", borderRadius: "var(--radius)", fontSize: "13px", cursor: "pointer",
                  }}
                >
                  {retriaging === lead.id ? "Analyzing…" : "🤖 Re-run AI Triage"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN", "MEDICAL", "VA", "FOUNDATION"]}>
      <LeadsContent />
    </ProtectedRoute>
  );
}
