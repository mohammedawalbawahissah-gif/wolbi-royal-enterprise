"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    api.get("/auth/profile/")
      .then((res) => {
        const role = res.data.role;
        const routes = {
          ADMIN:      "/dashboard/admin",
          MEDICAL:    "/dashboard/medical",
          VA:         "/dashboard/va",
          FOUNDATION: "/dashboard/foundation",
          CLIENT:     "/dashboard/client",
        };
        router.replace(routes[role] || "/dashboard/admin");
      })
      .catch(() => router.replace("/login"));
  }, []);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <p style={{ color: "var(--muted)" }}>Loading dashboard…</p>
    </div>
  );
}
