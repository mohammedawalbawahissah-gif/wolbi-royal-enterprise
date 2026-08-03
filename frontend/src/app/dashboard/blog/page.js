"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import StatusBadge from "@/components/StatusBadge";

function BlogContent() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api.get("/blog/").then((res) => setPosts(res.data.results || res.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const deletePost = async (id) => {
    if (!confirm("Delete this post?")) return;
    await api.delete(`/blog/${id}/`).catch(() => {});
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 700 }}>Blog Posts</h1>
        <Link href="/dashboard/blog/create" style={{ padding: "9px 18px", background: "var(--primary)", color: "#fff", borderRadius: "var(--radius)", fontSize: "14px", fontWeight: 500 }}>
          + New Post
        </Link>
      </div>

      {loading ? <p style={{ color: "var(--muted)" }}>Loading…</p>
        : posts.length === 0 ? <p style={{ color: "var(--muted)" }}>No posts yet. Create your first one.</p>
        : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {posts.map((p) => (
              <div key={p.id} style={{ background: "var(--card-bg)", padding: "20px", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: "15px" }}>{p.title}</p>
                  <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "4px" }}>{p.category} · {new Date(p.created_at).toLocaleDateString()}</p>
                  {p.excerpt && <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "6px" }}>{p.excerpt?.slice(0, 120)}…</p>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                  <StatusBadge status={p.status} />
                  <Link href={`/dashboard/blog/${p.id}`} style={{ fontSize: "13px", color: "var(--primary)", fontWeight: 500 }}>Edit</Link>
                  <button onClick={() => deletePost(p.id)} style={{ fontSize: "13px", color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

export default function BlogDashboardPage() {
  return <ProtectedRoute allowedRoles={["ADMIN", "FOUNDATION"]}><BlogContent /></ProtectedRoute>;
}
