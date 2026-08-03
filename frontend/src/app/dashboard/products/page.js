"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";

function ProductsContent() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/products/")
      .then((res) => setProducts(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "24px" }}>Products</h1>
      {loading ? (
        <p style={{ color: "var(--muted)" }}>Loading products…</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {products.map((p) => (
            <div key={p.id} style={{
              background: "var(--card-bg)", padding: "24px", borderRadius: "var(--radius-lg)",
              boxShadow: "var(--shadow)", borderTop: "4px solid var(--primary)",
            }}>
              <p style={{ fontWeight: 700, fontSize: "16px", marginBottom: "6px" }}>{p.name}</p>
              <p style={{ fontSize: "12px", color: "var(--accent)", marginBottom: "10px", fontWeight: 600 }}>
                {p.industry}
              </p>
              <p style={{ color: "var(--muted)", fontSize: "13px", lineHeight: 1.6 }}>{p.short_description}</p>
              {p.tagline && (
                <p style={{ marginTop: "10px", fontStyle: "italic", fontSize: "13px", color: "var(--muted)" }}>
                  "{p.tagline}"
                </p>
              )}
              {p.features?.length > 0 && (
                <div style={{ marginTop: "14px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 600, marginBottom: "6px" }}>Features</p>
                  <ul style={{ paddingLeft: "16px" }}>
                    {p.features.map((f) => (
                      <li key={f.id} style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "3px" }}>{f.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProductsDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={["ADMIN"]}>
      <ProductsContent />
    </ProtectedRoute>
  );
}
