"use client";

import Link from "next/link";
import { useState } from "react";

// ─── Section Wrapper ─────────────────────────────────────────────────────────
export function Section({ children, style = {}, className = "" }) {
  return (
    <section
      className={className}
      style={{ padding: "96px 2rem", maxWidth: "1200px", margin: "0 auto", ...style }}
    >
      {children}
    </section>
  );
}

export function FullSection({ children, style = {}, className = "" }) {
  return (
    <section className={className} style={{ padding: "96px 2rem", ...style }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>{children}</div>
    </section>
  );
}

// ─── Eyebrow + Heading ────────────────────────────────────────────────────────
export function SectionHeading({ eyebrow, title, subtitle, center = false }) {
  const wrapStyle = {
    marginBottom: "56px",
    textAlign: center ? "center" : "left",
    maxWidth: center ? "640px" : "100%",
    margin: center ? "0 auto 56px" : "0 0 56px",
  };
  return (
    <div style={wrapStyle}>
      {eyebrow && (
        <p style={{
          fontSize: "11px", fontWeight: 700, letterSpacing: "2px",
          textTransform: "uppercase", color: "var(--accent)", marginBottom: "12px",
        }}>
          {eyebrow}
        </p>
      )}
      <h2 style={{
        fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 800,
        color: "var(--foreground)", lineHeight: 1.15, letterSpacing: "-0.5px",
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          marginTop: "16px", fontSize: "17px", color: "var(--muted)",
          lineHeight: 1.7, maxWidth: "600px",
          ...(center ? { margin: "16px auto 0" } : {}),
        }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, hover = true }) {
  return (
    <div
      style={{
        background: "var(--card-bg)", borderRadius: "16px", padding: "32px",
        border: "1px solid var(--border)",
        transition: hover ? "transform 0.2s, box-shadow 0.2s" : "none",
        ...style,
      }}
      onMouseEnter={(e) => {
        if (hover) {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow = "var(--shadow-lg)";
        }
      }}
      onMouseLeave={(e) => {
        if (hover) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "none";
        }
      }}
    >
      {children}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Btn({ href, children, variant = "primary", style = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: "8px",
    padding: "13px 28px", borderRadius: "8px", fontSize: "15px",
    fontWeight: 600, textDecoration: "none",
    transition: "opacity 0.15s, transform 0.15s",
    cursor: "pointer", border: "none",
    ...style,
  };
  const variants = {
    primary:   { background: "var(--accent)",   color: "#fff" },
    secondary: { background: "var(--primary)",  color: "#fff" },
    outline:   { background: "transparent", color: "var(--primary)", border: "2px solid var(--primary)" },
    ghost:     { background: "rgba(255,255,255,0.12)", color: "#fff" },
  };
  return (
    <Link
      href={href}
      style={{ ...base, ...variants[variant] }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.88";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {children}
    </Link>
  );
}

// ─── Feature List Item ────────────────────────────────────────────────────────
export function FeatureItem({ icon, title, description }) {
  return (
    <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
      <div style={{
        width: "44px", height: "44px", borderRadius: "10px",
        background: "var(--muted-bg)", display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0, fontSize: "20px",
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>{title}</p>
        <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6 }}>{description}</p>
      </div>
    </div>
  );
}

// ─── Stat ─────────────────────────────────────────────────────────────────────
export function Stat({ value, label }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", marginTop: "8px", letterSpacing: "0.5px" }}>
        {label}
      </p>
    </div>
  );
}

// ─── Tag / Badge ──────────────────────────────────────────────────────────────
export function Tag({ children, color = "var(--accent)" }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 12px", borderRadius: "999px",
      fontSize: "12px", fontWeight: 600,
      background: `${color}18`, color,
    }}>
      {children}
    </span>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
export function Hero({ eyebrow, title, subtitle, cta, cta2, badge, children, dark = true }) {
  return (
    <div style={{
      minHeight: "92vh", display: "flex", alignItems: "center",
      background: dark
        ? "linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, var(--primary-light) 100%)"
        : "var(--muted-bg)",
      padding: "120px 2rem 80px", position: "relative", overflow: "hidden",
    }}>
      {dark && (
        <>
          <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "600px", height: "600px", borderRadius: "50%", background: "rgba(22,163,74,0.08)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "-10%", left: "-5%", width: "400px", height: "400px", borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
        </>
      )}
      <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
        {badge && (
          <div style={{ marginBottom: "20px" }}>
            <span style={{
              display: "inline-block", padding: "5px 14px", borderRadius: "999px",
              fontSize: "12px", fontWeight: 700,
              background: "rgba(22,163,74,0.2)", color: "#4ade80",
              letterSpacing: "1px", textTransform: "uppercase",
            }}>
              {badge}
            </span>
          </div>
        )}
        {eyebrow && (
          <p style={{
            fontSize: "12px", fontWeight: 700, letterSpacing: "2.5px",
            textTransform: "uppercase",
            color: dark ? "rgba(255,255,255,0.55)" : "var(--accent)",
            marginBottom: "16px",
          }}>
            {eyebrow}
          </p>
        )}
        <h1 style={{
          fontSize: "clamp(36px, 6vw, 72px)", fontWeight: 900, lineHeight: 1.05,
          letterSpacing: "-1.5px", color: dark ? "#fff" : "var(--foreground)",
          maxWidth: "820px", marginBottom: "24px",
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: dark ? "rgba(255,255,255,0.72)" : "var(--muted)",
            lineHeight: 1.7, maxWidth: "580px", marginBottom: "40px",
          }}>
            {subtitle}
          </p>
        )}
        {(cta || cta2) && (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            {cta  && <Btn href={cta.href}  variant={dark ? "primary" : "secondary"}>{cta.label}</Btn>}
            {cta2 && <Btn href={cta2.href} variant="ghost">{cta2.label}</Btn>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// ─── Newsletter Inline ────────────────────────────────────────────────────────
export function NewsletterInline() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(null);

  const submit = async () => {
    if (!email) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1"}/newsletter/subscribe/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      setStatus(res.ok ? "success" : "error");
      if (res.ok) setEmail("");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return <p style={{ color: "var(--accent)", fontWeight: 600 }}>You're subscribed — thanks!</p>;
  }

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          style={{
            flex: 1, minWidth: "220px", padding: "12px 16px", borderRadius: "8px",
            border: "1px solid var(--border)", background: "var(--input-bg)",
            color: "var(--foreground)", fontSize: "14px",
          }}
        />
        <button
          onClick={submit}
          style={{
            padding: "12px 24px", background: "var(--accent)", color: "#fff",
            border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer",
          }}
        >
          Subscribe
        </button>
      </div>
      {status === "error" && (
        <p style={{ color: "#ef4444", fontSize: "13px", marginTop: "8px" }}>
          Something went wrong. Please try again.
        </p>
      )}
    </div>
  );
}
