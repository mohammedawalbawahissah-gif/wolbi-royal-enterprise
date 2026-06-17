"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

const ROLES = [
  { value: "ADMIN",      label: "Admin",       description: "Full access to all dashboard sections, analytics, and user management." },
  { value: "MEDICAL",    label: "Medical",     description: "Wolbi Medical Services staff — manages leads, projects, and assignments." },
  { value: "VA",         label: "Virtual Assistant", description: "Wolbi Virtual Solutions staff — manages assignments and projects." },
  { value: "FOUNDATION", label: "Foundation",  description: "Wolbi Foundation staff — manages blog, programs, and volunteers." },
  { value: "CLIENT",     label: "Client",      description: "External client account — limited to viewing their own projects." },
];

function CreateUserContent() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "", email: "", password: "", first_name: "", last_name: "",
    phone: "", role: "MEDICAL", job_title: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/users/create/", form);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard/users"), 1500);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const firstError = Object.values(data)[0];
        setError(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        setError("Failed to create user. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", padding: "10px 14px", borderRadius: "var(--radius)",
    border: "1px solid var(--border)", background: "var(--input-bg)",
    color: "var(--foreground)", fontSize: "14px",
  };
  const label = { display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 };

  if (success) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px", color: "var(--accent)" }}>User created successfully.</p>
          <p style={{ color: "var(--muted)" }}>Redirecting to users list…</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "8px" }}>Add Staff Member</h1>
      <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "24px" }}>
        Create a new account directly with the correct role — no need to use Railway or Django Admin.
      </p>

      <div style={{ background: "var(--card-bg)", padding: "32px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", maxWidth: "640px" }}>
        <form onSubmit={handleSubmit}>

          {/* Role selector first — most important field */}
          <div style={{ marginBottom: "24px" }}>
            <label style={label}>Role *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {ROLES.map((r) => (
                <div
                  key={r.value}
                  onClick={() => setForm({ ...form, role: r.value })}
                  style={{
                    padding: "14px", borderRadius: "10px", cursor: "pointer",
                    border: `2px solid ${form.role === r.value ? "var(--accent)" : "var(--border)"}`,
                    background: form.role === r.value ? "var(--muted-bg)" : "transparent",
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>{r.label}</p>
                  <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.4 }}>{r.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={label}>First Name</label>
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} style={inp} />
            </div>
            <div>
              <label style={label}>Last Name</label>
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} style={inp} />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={label}>Username *</label>
            <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} style={inp} required />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={label}>Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={inp} required />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={label}>Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={inp} />
            </div>
            <div>
              <label style={label}>Job Title</label>
              <input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} style={inp} placeholder="e.g. Lab Technician" />
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={label}>Password * (minimum 8 characters)</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={inp} required minLength={8} />
          </div>

          {error && <p style={{ color: "#ef4444", marginBottom: "16px", fontSize: "13px" }}>{error}</p>}

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={loading} style={{
              padding: "10px 24px", background: "var(--primary)", color: "#fff",
              border: "none", borderRadius: "var(--radius)", fontSize: "14px", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            }}>
              {loading ? "Creating…" : "Create User"}
            </button>
            <button type="button" onClick={() => router.back()} style={{
              padding: "10px 24px", background: "var(--muted-bg)", color: "var(--foreground)",
              border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "14px", cursor: "pointer",
            }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateUserPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <CreateUserContent />
    </ProtectedRoute>
  );
}
