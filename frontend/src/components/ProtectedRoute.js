"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | allowed | denied

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    api
      .get("/auth/profile/")
      .then((res) => {
        const { role } = res.data;
        if (allowedRoles.length === 0 || allowedRoles.includes(role)) {
          setStatus("allowed");
        } else {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, []);

  if (status === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      </div>
    );
  }

  return children;
}
