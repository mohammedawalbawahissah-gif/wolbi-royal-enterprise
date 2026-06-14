"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

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
