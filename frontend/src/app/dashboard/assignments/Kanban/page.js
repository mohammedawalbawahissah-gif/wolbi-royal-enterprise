"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";

const COLUMNS = [
  { key: "PENDING",     label: "Pending",      next: "IN_PROGRESS" },
  { key: "IN_PROGRESS", label: "In Progress",  next: "REVIEW" },
  { key: "REVIEW",      label: "Under Review", next: "COMPLETED" },
  { key: "COMPLETED",   label: "Completed",    next: null },
];

function KanbanContent() {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => { load(); }, []);

  const load = () =>
    api.get("/assignments/").then((r) => setAssignments(r.data.results || r.data)).catch(() => {});

  const moveForward = async (id, nextStatus) => {
    await api.patch(`/assignments/${id}/`, { status: nextStatus });
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700 }}>Assignments Kanban</h1>
        <Link href="/dashboard/assignments" style={{
          padding: "9px 18px", background: "var(--muted-bg)", color: "var(--foreground)",
          borderRadius: "var(--radius)", fontSize: "14px", border: "1px solid var(--border)",
        }}>
          List View
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", alignItems: "start" }}>
        {COLUMNS.map((col) => {
          const items = assignments.filter((a) => a.status === col.key);
          return (
            <div key={col.key} style={{
              background: "var(--muted-bg)", borderRadius: "var(--radius-lg)",
              padding: "16px", minHeight: "400px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h2 style={{ fontSize: "14px", fontWeight: 700 }}>{col.label}</h2>
                <span style={{
                  background: "var(--border)", borderRadius: "999px", padding: "2px 8px",
                  fontSize: "12px", fontWeight: 600,
                }}>
                  {items.length}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.map((a) => (
                  <div key={a.id} style={{
                    background: "var(--card-bg)", padding: "14px", borderRadius: "var(--radius)",
                    boxShadow: "var(--shadow)",
                  }}>
                    <Link href={`/dashboard/assignments/${a.id}`} style={{ textDecoration: "none" }}>
                      <p style={{ fontWeight: 600, fontSize: "14px", color: "var(--foreground)", marginBottom: "4px" }}>
                        {a.title}
                      </p>
                    </Link>
                    <p style={{ color: "var(--muted)", fontSize: "12px", marginBottom: "8px" }}>
                      {a.assigned_to_name || a.assigned_to}
                    </p>
                    <StatusBadge status={a.status} />
                    {col.next && (
                      <button
                        onClick={() => moveForward(a.id, col.next)}
                        style={{
                          display: "block", marginTop: "10px", width: "100%", padding: "6px",
                          background: "var(--primary)", color: "#fff", border: "none",
                          borderRadius: "var(--radius)", fontSize: "12px", cursor: "pointer",
                        }}
                      >
                        Move Forward →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function KanbanPage() {
  return (
    <ProtectedRoute>
      <KanbanContent />
    </ProtectedRoute>
  );
}
