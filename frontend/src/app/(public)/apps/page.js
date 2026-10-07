"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hero, FullSection } from "@/components/ui";
import { AppGrid } from "@/components/AppCards";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AppsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Plain fetch (no auth header): this page only ever lists public apps
    fetch(`${API}/portal/apps/`)
      .then((r) => r.json())
      .then((d) => setApps(Array.isArray(d) ? d : d.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Hero
        eyebrow="Our Apps"
        title="Every Wolbi platform, one place."
        subtitle="Open any of our platforms directly from here. Team members and clients can find the apps meant for them inside the dashboard."
        cta={{ href: "/login", label: "Sign in for your apps" }}
      />

      <FullSection>
        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading apps…</p>
        ) : apps.length === 0 ? (
          <p style={{ color: "var(--muted)" }}>
            Our apps are launching soon. <Link href="/contact" style={{ color: "var(--accent)", fontWeight: 600 }}>Get in touch</Link> to hear first.
          </p>
        ) : (
          <AppGrid apps={apps} />
        )}
      </FullSection>
    </>
  );
}
