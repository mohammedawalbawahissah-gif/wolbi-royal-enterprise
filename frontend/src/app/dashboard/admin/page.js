"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

function StatCard({ label, value, color = "var(--primary)" }) {
  return (
    <div style={{
      background: "var(--card-bg)", borderRadius: "var(--radius-lg)",
      padding: "24px", boxShadow: "var(--shadow)",
      borderTop: `4px solid ${color}`,
    }}>
      <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "8px" }}>{label}</p>
      <p style={{ fontSize: "32px", fontWeight: 700, color }}>{value ?? "—"}</p>
    </div>
  );
}

function AdminContent() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    api.get("/core/analytics/").then((res) => setAnalytics(res.data)).catch(() => {});
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>Admin Overview</h1>
      <p style={{ color: "var(--muted)", marginBottom: "32px" }}>
        Wolbi Royal Enterprise — Dashboard Analytics
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        <StatCard label="Total Leads"    value={analytics?.leads}       color="var(--primary)" />
        <StatCard label="New Leads"      value={analytics?.leads_new}   color="#f59e0b" />
        <StatCard label="Projects"       value={analytics?.projects}    color="var(--accent)" />
        <StatCard label="Blog Posts"     value={analytics?.blog_posts}  color="#8b5cf6" />
        <StatCard label="Services"       value={analytics?.services}    color="#06b6d4" />
        <StatCard label="Subscribers"    value={analytics?.subscribers} color="#ec4899" />
      </div>

      {analytics?.projects_by_status && (
        <div style={{ background: "var(--card-bg)", borderRadius: "var(--radius-lg)", padding: "24px", boxShadow: "var(--shadow)", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Projects by Status</h2>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {Object.entries(analytics.projects_by_status).map(([label, count]) => (
              <div key={label} style={{ textAlign: "center", minWidth: "80px" }}>
                <p style={{ fontSize: "24px", fontWeight: 700 }}>{count}</p>
                <p style={{ fontSize: "12px", color: "var(--muted)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {analytics?.leads_by_type && (
        <div style={{ background: "var(--card-bg)", borderRadius: "var(--radius-lg)", padding: "24px", boxShadow: "var(--shadow)" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Leads by Type</h2>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            {Object.entries(analytics.leads_by_type).map(([label, count]) => (
              <div key={label} style={{ textAlign: "center", minWidth: "80px" }}>
                <p style={{ fontSize: "24px", fontWeight: 700 }}>{count}</p>
                <p style={{ fontSize: "12px", color: "var(--muted)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <AdminContent />
    </ProtectedRoute>
  );
}
