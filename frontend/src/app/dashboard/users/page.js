"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";

const ROLE_COLORS = {
  ADMIN:      { bg: "#fee2e2", color: "#991b1b" },
  MEDICAL:    { bg: "#fce7f3", color: "#9d174d" },
  VA:         { bg: "#ede9fe", color: "#5b21b6" },
  FOUNDATION: { bg: "#dcfce7", color: "#166534" },
  CLIENT:     { bg: "#f1f5f9", color: "#475569" },
};

function RoleBadge({ role }) {
  const style = ROLE_COLORS[role] || ROLE_COLORS.CLIENT;
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: "999px",
      fontSize: "12px", fontWeight: 600, background: style.bg, color: style.color,
    }}>
      {role}
    </span>
  );
}

function UsersContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const load = () => {
    api.get("/auth/users/")
      .then((res) => setUsers(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (user) => {
    if (!confirm(`${user.is_active ? "Deactivate" : "Reactivate"} ${user.username}?`)) return;
    try {
      await api.patch(`/auth/users/${user.id}/`, { is_active: !user.is_active });
      load();
    } catch {
      alert("Failed to update user status.");
    }
  };

  const filtered = filter === "ALL" ? users : users.filter((u) => u.role === filter);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 700 }}>Users & Staff</h1>
          <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>
            {users.length} total user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/dashboard/users/create" style={{
          padding: "9px 18px", background: "var(--primary)", color: "#fff",
          borderRadius: "var(--radius)", fontSize: "14px", fontWeight: 600,
        }}>
          + Add Staff Member
        </Link>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["ALL", "ADMIN", "MEDICAL", "VA", "FOUNDATION", "CLIENT"].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            style={{
              padding: "7px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 600,
              cursor: "pointer", border: "none",
              background: filter === r ? "var(--primary)" : "var(--muted-bg)",
              color: filter === r ? "#fff" : "var(--foreground)",
            }}
          >
            {r}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading users…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No users found.</p>
      ) : (
        <div style={{ background: "var(--card-bg)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--muted-bg)" }}>
                {["Username", "Email", "Role", "Status", "Joined", ""].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderTop: "1px solid var(--border)", background: i % 2 === 0 ? "transparent" : "var(--muted-bg)" }}>
                  <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: 600 }}>
                    {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : u.username}
                    <p style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 400 }}>@{u.username}</p>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--muted)" }}>{u.email}</td>
                  <td style={{ padding: "12px 16px" }}><RoleBadge role={u.role} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    <StatusBadge status={u.is_active ? "ACTIVE" : "INACTIVE"} />
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "13px", color: "var(--muted)" }}>
                    {u.date_joined ? new Date(u.date_joined).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => toggleActive(u)}
                      style={{
                        fontSize: "12px", fontWeight: 600, cursor: "pointer", border: "none",
                        background: "none", color: u.is_active ? "#ef4444" : "var(--accent)",
                      }}
                    >
                      {u.is_active ? "Deactivate" : "Reactivate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <UsersContent />
    </ProtectedRoute>
  );
}
