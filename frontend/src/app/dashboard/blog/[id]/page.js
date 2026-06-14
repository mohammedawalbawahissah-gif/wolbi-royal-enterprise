"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

const CATEGORIES = ["TECHNOLOGY", "MEDICAL", "AGRICULTURE", "BUSINESS", "FOUNDATION", "OTHER"];

function EditBlogContent({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/blog/${id}/`).then((r) => setForm(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/blog/${id}/`, form);
      router.push("/dashboard/blog");
    } catch (err) {
      setError("Failed to update post.");
    } finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "10px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "14px" };

  if (!form) return <p style={{ color: "var(--muted)" }}>Loading…</p>;

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px" }}>Edit Blog Post</h1>
      <div style={{ background: "var(--card-bg)", padding: "32px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", maxWidth: "800px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Title</label>
            <input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} style={inp} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Category</label>
              <select value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inp}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Status</label>
              <select value={form.status || "DRAFT"} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inp}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Excerpt</label>
            <textarea value={form.excerpt || ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} style={inp} />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Content</label>
            <textarea value={form.content || ""} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={16} style={{ ...inp, fontFamily: "monospace" }} />
          </div>
          {error && <p style={{ color: "#ef4444", marginBottom: "16px", fontSize: "13px" }}>{error}</p>}
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={loading} style={{ padding: "10px 24px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
              {loading ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" onClick={() => router.back()} style={{ padding: "10px 24px", background: "var(--muted-bg)", color: "var(--foreground)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: "14px", cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditBlogPage({ params }) {
  return <ProtectedRoute allowedRoles={["ADMIN", "FOUNDATION"]}><EditBlogContent params={params} /></ProtectedRoute>;
}
