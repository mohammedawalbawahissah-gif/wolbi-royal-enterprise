"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

const ROLES = [
  { value: "ADMIN",      label: "Admin",       description: "Full access to all dashboard sections, analytics, and user management." },
  { value: "MEDICAL",    label: "Medical",     description: "Wolbi Medical Services staff — manages leads, projects, and assignments." },
  { value: "TECH",       label: "Tech Specialist", description: "Wolbi Technologies staff — software, data, security, and creative tech specialists." },
  { value: "VA",         label: "Virtual Assistant", description: "Wolbi Virtual Solutions staff — manages assignments and projects." },
  { value: "FOUNDATION", label: "Foundation",  description: "Wolbi Foundation staff — manages blog, programs, and volunteers." },
  { value: "CLIENT",     label: "Client",      description: "External client account — limited to viewing their own projects." },
];

// Specialty options shown per role — mirrors the Specialty choices on the backend User model
const SPECIALTIES_BY_ROLE = {
  TECH: [
    { value: "FULL_STACK",        label: "Full Stack Software Engineering" },
    { value: "MOBILE_DEV",        label: "Mobile App Development" },
    { value: "CYBER_SECURITY",    label: "Cyber Security" },
    { value: "DATA_ANALYSIS",     label: "Data Analysis" },
    { value: "MACHINE_LEARNING",  label: "Machine Learning" },
    { value: "RESEARCH",          label: "Research Work" },
    { value: "CREATIVE_AI",       label: "Creative Tech (AI)" },
    { value: "VIRTUAL_ASSISTANCE",label: "Virtual Assistance" },
    { value: "CONTENT_CREATION",  label: "Content Creation" },
  ],
  MEDICAL: [
    { value: "LAB_DIAGNOSTICS", label: "Laboratory Diagnostics" },
    { value: "USG_SCANNING",    label: "USG / Ultrasound Scanning" },
    { value: "DNA_TESTING",     label: "DNA Testing" },
    { value: "HEALTH_ADVISORY", label: "Health Advisory & Consulting" },
    { value: "TELEHEALTH",      label: "Telehealth Support" },
  ],
  FOUNDATION: [
    { value: "PROGRAMS_HEALTH",    label: "Health Programs" },
    { value: "PROGRAMS_EDUCATION", label: "Education Programs" },
    { value: "PROGRAMS_YOUTH",     label: "Youth Empowerment Programs" },
    { value: "VOLUNTEER_COORD",    label: "Volunteer Coordination" },
  ],
  VA: [
    { value: "EXEC_ASSISTANCE", label: "Executive Assistance" },
    { value: "BUSINESS_OPS",    label: "Business Operations" },
    { value: "CRM_MANAGEMENT",  label: "CRM Management" },
  ],
};

function CreateUserContent() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "", email: "", password: "", first_name: "", last_name: "",
    phone: "", role: "TECH", specialty: "", job_title: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleRoleChange = (roleValue) => {
    // Reset specialty whenever role changes, since the options differ
    setForm({ ...form, role: roleValue, specialty: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const payload = { ...form };
      if (!payload.specialty) delete payload.specialty;
      await api.post("/auth/users/create/", payload);
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

  const currentSpecialties = SPECIALTIES_BY_ROLE[form.role] || [];
  const specialtyRequired = currentSpecialties.length > 0;

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
        Create a new account directly with the correct role and specialty — no need to use Railway or Django Admin.
      </p>

      <div style={{ background: "var(--card-bg)", padding: "32px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", maxWidth: "640px" }}>
        <form onSubmit={handleSubmit}>

          {/* Role selector */}
          <div style={{ marginBottom: "24px" }}>
            <label style={label}>Role *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {ROLES.map((r) => (
                <div
                  key={r.value}
                  onClick={() => handleRoleChange(r.value)}
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

          {/* Specialty dropdown — only shown for roles that have specialties */}
          {specialtyRequired && (
            <div style={{ marginBottom: "24px" }}>
              <label style={label}>
                Specialty * <span style={{ color: "var(--muted)", fontWeight: 400 }}>— select their professional focus</span>
              </label>
              <select
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                style={{ ...inp, cursor: "pointer" }}
                required
              >
                <option value="">— Choose a specialty —</option>
                {currentSpecialties.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

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
              <input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} style={inp} placeholder="e.g. Senior Developer" />
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
