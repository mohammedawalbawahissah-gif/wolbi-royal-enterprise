"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

const UNITS = ["TECHNOLOGIES", "MEDICAL", "VIRTUAL_SOLUTIONS", "FOUNDATION"];
const STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

function CreateProjectContent() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", slug: "", summary: "", description: "", business_unit: "TECHNOLOGIES", status: "PENDING", featured: false, project_url: "" });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateSlug = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (image) formData.append("image", image);
      await api.post("/projects/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      router.push("/dashboard/projects");
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Failed to create project.");
    } finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "10px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "14px" };

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px" }}>New Project</h1>
      <div style={{ background: "var(--card-bg)", padding: "32px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", maxWidth: "700px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Project Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })} style={inp} required />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Slug *</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} style={inp} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Division</label>
              <select value={form.business_unit} onChange={(e) => setForm({ ...form, business_unit: e.target.value })} style={inp}>
                {UNITS.map((u) => <option key={u} value={u}>{u.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inp}>
                {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Summary</label>
            <textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={2} style={inp} placeholder="One or two sentence summary for the public listing..." />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Full Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={8} style={inp} />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Project URL (if live)</label>
            <input type="url" value={form.project_url} onChange={(e) => setForm({ ...form, project_url: e.target.value })} style={inp} placeholder="https://..." />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Cover Image</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
          </div>
          <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
            <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            <label htmlFor="featured" style={{ fontSize: "14px", fontWeight: 500 }}>Feature on public portfolio</label>
          </div>
          {error && <p style={{ color: "#ef4444", marginBottom: "16px", fontSize: "13px" }}>{error}</p>}
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={loading} style={{ padding: "10px 24px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "14px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Creating…" : "Create Project"}
            </button>
            <button type="button" onClick={() => router.back()} style={{ padding: "10px 24px", background: "var(--muted-bg)", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "14px", cursor: "pointer" }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CreateProjectPage() {
  return <ProtectedRoute allowedRoles={["ADMIN"]}><CreateProjectContent /></ProtectedRoute>;
}
