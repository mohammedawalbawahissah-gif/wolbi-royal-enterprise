"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hero, FullSection, SectionHeading, Tag } from "@/components/ui";

const CATEGORIES = ["ALL", "TECHNOLOGY", "MEDICAL", "AGRICULTURE", "BUSINESS", "FOUNDATION"];

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("ALL");

  const load = (cat) => {
    const url = cat === "ALL"
      ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/blog/?public=true`
      : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/blog/?public=true&category=${cat}`;
    fetch(url).then((r) => r.json()).then((d) => setPosts(d.results || d)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(category); }, [category]);

  return (
    <>
      <Hero
        eyebrow="Blog"
        title="Thinking from inside Africa's fastest-moving sectors."
        subtitle="Healthcare innovation, agritech, enterprise software, and community development — written by practitioners, not observers."
        dark
      />

      <FullSection>
        {/* Category filter */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "40px", flexWrap: "wrap" }}>
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => { setCategory(c); setLoading(true); }} style={{
              padding: "8px 18px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "none",
              background: category === c ? "var(--primary)" : "var(--muted-bg)",
              color: category === c ? "#fff" : "var(--foreground)",
            }}>
              {c === "ALL" ? "All Posts" : c.charAt(0) + c.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading posts…</p>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No posts yet.</p>
            <p style={{ color: "var(--muted)" }}>Check back soon — we're writing.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "var(--card-bg)", borderRadius: "16px", overflow: "hidden",
                  border: "1px solid var(--border)", height: "100%",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
                >
                  {post.featured_image && (
                    <img src={post.featured_image} alt={post.title} style={{ width: "100%", height: "200px", objectFit: "cover" }} />
                  )}
                  <div style={{ padding: "24px" }}>
                    <div style={{ marginBottom: "12px" }}>
                      <Tag color="var(--primary)">{post.category}</Tag>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: "17px", marginBottom: "10px", lineHeight: 1.4, color: "var(--foreground)" }}>{post.title}</p>
                    <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>{post.excerpt}</p>
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "16px" }}>
                      {post.author_name} · {new Date(post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </FullSection>
    </>
  );
}
