"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

function AIDraftPanel() {
  const [topic, setTopic] = useState("");
  const [businessUnit, setBusinessUnit] = useState("GENERAL");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/newsletter/ai-draft/", { topic, business_unit: businessUnit });
      setDraft(res.data.draft);
    } catch {
      setError("AI drafting isn't available right now. Make sure ANTHROPIC_API_KEY is configured.");
    }
    setLoading(false);
  };

  const copy = () => navigator.clipboard.writeText(draft);

  const inputStyle = { padding: "10px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "14px" };

  return (
    <div style={{ background: "var(--card-bg)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", padding: "24px", marginBottom: "24px" }}>
      <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>🤖 Draft a Newsletter with AI</h2>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" }}>
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What's this newsletter about?" style={{ ...inputStyle, flex: 1, minWidth: "220px" }} />
        <select value={businessUnit} onChange={(e) => setBusinessUnit(e.target.value)} style={inputStyle}>
          <option value="GENERAL">General / All divisions</option>
          <option value="TECHNOLOGIES">Wolbi Technologies</option>
          <option value="MEDICAL">Wolbi Medical Services</option>
          <option value="VIRTUAL_SOLUTIONS">Wolbi Virtual Solutions</option>
          <option value="FOUNDATION">Wolbi Foundation</option>
        </select>
        <button onClick={generate} disabled={loading || !topic.trim()} style={{ padding: "10px 18px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "14px", cursor: "pointer" }}>
          {loading ? "Drafting…" : "Draft"}
        </button>
      </div>
      {error && <p style={{ color: "#e11d48", fontSize: "13px" }}>{error}</p>}
      {draft && (
        <div>
          <textarea readOnly value={draft} rows={10} style={{ ...inputStyle, width: "100%", fontFamily: "inherit", whiteSpace: "pre-wrap" }} />
          <button onClick={copy} style={{ marginTop: "8px", padding: "6px 14px", background: "transparent", border: "1px solid var(--border)", color: "var(--foreground)", borderRadius: "var(--radius)", fontSize: "13px", cursor: "pointer" }}>
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}

function NewsletterContent() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/newsletter/subscribers/")
      .then((r) => setSubscribers(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.first_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    const csv = ["Email,Name,Date"].concat(filtered.map((s) => `${s.email},${s.first_name || ""},${new Date(s.created_at).toLocaleDateString()}`)).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "subscribers.csv"; a.click();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700 }}>Newsletter Subscribers</h1>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>{subscribers.length} active subscriber{subscribers.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={exportCSV} style={{ padding: "9px 18px", background: "var(--accent)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
          Export CSV
        </button>
      </div>

      <AIDraftPanel />

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by email or name…"
        style={{ width: "100%", maxWidth: "360px", padding: "10px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "14px", marginBottom: "20px" }}
      />

      {loading ? <p style={{ color: "var(--muted)" }}>Loading…</p>
        : filtered.length === 0 ? <p style={{ color: "var(--muted)" }}>No subscribers found.</p>
        : (
          <div style={{ background: "var(--card-bg)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--muted-bg)" }}>
                  {["Email", "Name", "Subscribed"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} style={{ borderTop: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "var(--muted-bg)" }}>
                    <td style={{ padding: "12px 16px", fontSize: "14px" }}>{s.email}</td>
                    <td style={{ padding: "12px 16px", fontSize: "14px", color: "var(--muted)" }}>{s.first_name || "—"}</td>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--muted)" }}>{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}

export default function NewsletterDashboardPage() {
  return <ProtectedRoute allowedRoles={["ADMIN"]}><NewsletterContent /></ProtectedRoute>;
}
