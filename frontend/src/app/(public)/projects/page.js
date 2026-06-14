"use client";

import { useEffect, useState } from "react";
import { Hero, FullSection, SectionHeading, Card, Tag } from "@/components/ui";

const UNIT_COLORS = {
  TECHNOLOGIES: "var(--primary)",
  MEDICAL:      "#e11d48",
  FOUNDATION:   "var(--accent)",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/projects/?public=true`)
      .then((r) => r.json())
      .then((d) => setProjects(d.results || d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const units = ["ALL", ...new Set(projects.map((p) => p.business_unit))];
  const filtered = filter === "ALL" ? projects : projects.filter((p) => p.business_unit === filter);

  return (
    <>
      <Hero
        eyebrow="Projects"
        title="Work that speaks for itself."
        subtitle="A selection of completed and ongoing projects across all four divisions of Wolbi Royal Enterprise."
        cta={{ href: "/contact", label: "Start a Project" }}
      />

      <FullSection>
        {/* Filter */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "40px", flexWrap: "wrap" }}>
          {units.map((u) => (
            <button
              key={u}
              onClick={() => setFilter(u)}
              style={{
                padding: "8px 18px", borderRadius: "999px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "none",
                background: filter === u ? "var(--primary)" : "var(--muted-bg)",
                color: filter === u ? "#fff" : "var(--foreground)",
              }}
            >
              {u === "ALL" ? "All Projects" : u.charAt(0) + u.slice(1).toLowerCase().replace("_", " ")}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading projects…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>No projects to display yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
            {filtered.map((p) => (
              <Card key={p.id} style={{ overflow: "hidden", padding: 0 }}>
                {p.image && <img src={p.image} alt={p.title} style={{ width: "100%", height: "200px", objectFit: "cover" }} />}
                <div style={{ padding: "24px" }}>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
                    <Tag color={UNIT_COLORS[p.business_unit] || "var(--primary)"}>{p.business_unit}</Tag>
                    {p.project_type && <Tag color="var(--muted)">{p.project_type}</Tag>}
                  </div>
                  <p style={{ fontWeight: 700, fontSize: "17px", marginBottom: "8px" }}>{p.title}</p>
                  <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>{p.summary}</p>
                  {p.project_url && (
                    <a href={p.project_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: "16px", fontSize: "13px", color: "var(--accent)", fontWeight: 600 }}>
                      View Project →
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </FullSection>
    </>
  );
}
