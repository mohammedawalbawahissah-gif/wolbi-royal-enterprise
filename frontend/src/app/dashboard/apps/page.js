"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AppGrid } from "@/components/AppCards";

function AppsContent() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/portal/apps/")
      .then((res) => setApps(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "4px" }}>My Apps</h1>
      <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "24px" }}>
        Launch the Wolbi platforms available to your account.
      </p>
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading apps…</p>
      ) : apps.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>No apps have been assigned to your account yet.</p>
      ) : (
        <AppGrid apps={apps} />
      )}
    </div>
  );
}

export default function AppsPage() {
  return (
    <ProtectedRoute>
      <AppsContent />
    </ProtectedRoute>
  );
}
