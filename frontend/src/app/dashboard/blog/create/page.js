"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

const CATEGORIES = ["TECHNOLOGY", "MEDICAL", "AGRICULTURE", "BUSINESS", "FOUNDATION", "OTHER"];

function CreateBlogContent() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", slug: "", category: "TECHNOLOGY", excerpt: "", content: "", status: "DRAFT", featured: false });
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
      if (image) formData.append("featured_image", image);
      await api.post("/blog/", formData, { headers: { "Content-Type": "multipart/form-data" } });
      router.push("/dashboard/blog");
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Failed to create post.");
    } finally { setLoading(false); }
  };

  const inp = { width: "100%", padding: "10px 14px", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "var(--input-bg)", color: "var(--foreground)", fontSize: "14px" };

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px" }}>New Blog Post</h1>
      <div style={{ background: "var(--card-bg)", padding: "32px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", maxWidth: "800px" }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })} style={inp} required />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Slug *</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} style={inp} required />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={inp}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inp}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Excerpt</label>
            <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} style={inp} placeholder="Short summary shown in listing pages..." />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Content *</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={16} style={{ ...inp, fontFamily: "monospace" }} required placeholder="Write your blog post content here..." />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>Featured Image</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
          </div>
          <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "10px" }}>
            <input type="checkbox" id="featured" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            <label htmlFor="featured" style={{ fontSize: "14px", fontWeight: 500 }}>Mark as Featured Post</label>
          </div>
          {error && <p style={{ color: "#ef4444", marginBottom: "16px", fontSize: "13px" }}>{error}</p>}
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={loading} style={{ padding: "10px 24px", background: "var(--primary)", color: "#fff", border: "none", borderRadius: "var(--radius)", fontSize: "14px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Publishing…" : "Publish Post"}
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

export default function CreateBlogPage() {
  return <ProtectedRoute allowedRoles={["ADMIN", "FOUNDATION"]}><CreateBlogContent /></ProtectedRoute>;
}
