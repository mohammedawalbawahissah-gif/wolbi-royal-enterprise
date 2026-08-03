"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";

function AssignmentsContent() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/assignments/")
      .then((res) => setAssignments(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700 }}>Assignments</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/dashboard/assignments/kanban" style={{
            padding: "9px 18px", background: "var(--muted-bg)", color: "var(--foreground)",
            borderRadius: "var(--radius)", fontSize: "14px", border: "1px solid var(--border)",
          }}>
            Kanban View
          </Link>
          <Link href="/dashboard/assignments/create" style={{
            padding: "9px 18px", background: "var(--primary)", color: "#fff",
            borderRadius: "var(--radius)", fontSize: "14px", fontWeight: 500,
          }}>
            + New Assignment
          </Link>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading assignments…</p>
      ) : assignments.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No assignments yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {assignments.map((a) => (
            <Link key={a.id} href={`/dashboard/assignments/${a.id}`} style={{ textDecoration: "none" }}>
              <div style={{
                background: "var(--card-bg)", padding: "18px 20px", borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow)", display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "15px", color: "var(--foreground)" }}>{a.title}</p>
                  <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "2px" }}>
                    Assigned to: {a.assigned_to_name || a.assigned_to}
                    {a.due_date ? ` · Due ${new Date(a.due_date).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssignmentsPage() {
  return (
    <ProtectedRoute>
      <AssignmentsContent />
    </ProtectedRoute>
  );
}
