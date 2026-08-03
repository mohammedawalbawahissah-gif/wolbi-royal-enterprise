"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Tag, Btn } from "@/components/ui";
import { ArrowLeft } from "lucide-react";

export default function BlogPostPage({ params }) {
  const { slug } = use(params);
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/blog/${slug}/`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then(setPost)
      .catch(() => setNotFound(true));
  }, [slug]);

  if (notFound) return (
    <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 2rem" }}>
      <p style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>Post not found.</p>
      <Btn href="/blog" variant="secondary"><ArrowLeft size={14} /> Back to Blog</Btn>
    </div>
  );

  if (!post) return <div style={{ minHeight: "80vh", padding: "120px 2rem", textAlign: "center" }}><p style={{ color: "var(--muted)" }}>Loading…</p></div>;

  return (
    <div style={{ paddingTop: "80px" }}>
      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, var(--primary-dark), var(--primary))",
        padding: "80px 2rem 64px", color: "#fff",
      }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <Link href="/blog" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "rgba(255,255,255,0.6)", fontSize: "13px", marginBottom: "24px", textDecoration: "none" }}>
            <ArrowLeft size={13} /> Back to Blog
          </Link>
          <div style={{ marginBottom: "16px" }}>
            <Tag color="#4ade80">{post.category}</Tag>
          </div>
          <h1 style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.5px", marginBottom: "20px" }}>{post.title}</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "15px" }}>
            By {post.author_name} · {new Date(post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {post.featured_image && (
        <div style={{ maxWidth: "760px", margin: "0 auto", padding: "0 2rem" }}>
          <img src={post.featured_image} alt={post.title} style={{ width: "100%", borderRadius: "16px", marginTop: "-32px", boxShadow: "var(--shadow-lg)" }} />
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 2rem 96px" }}>
        <div
          style={{ fontSize: "17px", lineHeight: 1.85, color: "var(--foreground)" }}
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, "<br/>") }}
        />
        <div style={{ marginTop: "48px", paddingTop: "32px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <Btn href="/blog" variant="outline"><ArrowLeft size={14} /> More Articles</Btn>
          <Btn href="/contact" variant="secondary">Work with Wolbi</Btn>
        </div>
      </div>
    </div>
  );
}
