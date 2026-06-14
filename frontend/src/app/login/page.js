"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.username, form.password);
      router.push("/dashboard");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "var(--muted-bg)",
    }}>
      <div style={{
        background: "var(--card-bg)", padding: "40px", borderRadius: "var(--radius-lg)",
        width: "100%", maxWidth: "420px", boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--primary)" }}>
            Wolbi Royal Enterprise
          </h1>
          <p style={{ color: "var(--muted)", marginTop: "6px", fontSize: "14px" }}>
            Sign in to your dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>
              Username
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "var(--radius)",
                border: "1px solid var(--border)", background: "var(--input-bg)",
                color: "var(--foreground)", fontSize: "14px",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 500 }}>
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "var(--radius)",
                border: "1px solid var(--border)", background: "var(--input-bg)",
                color: "var(--foreground)", fontSize: "14px",
              }}
            />
          </div>

          {error && (
            <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "16px" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px", background: "var(--primary)",
              color: "#fff", border: "none", borderRadius: "var(--radius)",
              fontSize: "15px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
