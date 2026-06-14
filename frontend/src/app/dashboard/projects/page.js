"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";

function ProjectsContent() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/projects/")
      .then((res) => setProjects(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700 }}>Projects</h1>
        <Link href="/dashboard/projects/create" style={{
          padding: "9px 18px", background: "var(--primary)", color: "#fff",
          borderRadius: "var(--radius)", fontSize: "14px", fontWeight: 500,
        }}>
          + New Project
        </Link>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading projects…</p>
      ) : projects.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No projects yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {projects.map((p) => (
            <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: "var(--card-bg)", padding: "20px", borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow)", height: "100%", transition: "box-shadow 0.2s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <p style={{ fontWeight: 600, fontSize: "15px", color: "var(--foreground)" }}>{p.title}</p>
                  <StatusBadge status={p.status} />
                </div>
                <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.5 }}>
                  {p.summary?.slice(0, 120)}{p.summary?.length > 120 ? "…" : ""}
                </p>
                <p style={{ color: "var(--muted)", fontSize: "12px", marginTop: "12px" }}>
                  {p.business_unit} · {new Date(p.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <ProjectsContent />
    </ProtectedRoute>
  );
}
