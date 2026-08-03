"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

const UNIT_LABELS = {
  TECHNOLOGIES:      "Wolbi Technologies",
  MEDICAL:           "Wolbi Medical Services",
  VIRTUAL_SOLUTIONS: "Wolbi Virtual Solutions",
  FOUNDATION:        "Wolbi Foundation",
};

function ServicesContent() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/services/")
      .then((res) => setServices(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = services.reduce((acc, s) => {
    const unit = s.business_unit;
    if (!acc[unit]) acc[unit] = [];
    acc[unit].push(s);
    return acc;
  }, {});

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px" }}>Services</h1>
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading services…</p>
      ) : (
        Object.entries(grouped).map(([unit, items]) => (
          <div key={unit} style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px", color: "var(--primary)" }}>
              {UNIT_LABELS[unit] || unit}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
              {items.map((s) => (
                <div key={s.id} style={{
                  background: "var(--card-bg)", padding: "18px", borderRadius: "var(--radius-lg)",
                  boxShadow: "var(--shadow)",
                }}>
                  <p style={{ fontWeight: 600, fontSize: "14px", marginBottom: "6px" }}>{s.name}</p>
                  <p style={{ color: "var(--muted)", fontSize: "13px" }}>{s.short_description}</p>
                  {s.featured && (
                    <span style={{ display: "inline-block", marginTop: "8px", fontSize: "11px", background: "#fef3c7", color: "#92400e", padding: "2px 8px", borderRadius: "999px" }}>
                      Featured
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default function ServicesDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <ServicesContent />
    </ProtectedRoute>
  );
}
