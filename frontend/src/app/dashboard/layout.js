"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import LogoutButton from "@/components/LogoutButton";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";

const NAV_LINKS = {
  ADMIN: [
    { href: "/dashboard/admin",       label: "Overview" },
    { href: "/dashboard/leads",       label: "Leads" },
    { href: "/dashboard/projects",    label: "Projects" },
    { href: "/dashboard/assignments", label: "Assignments" },
    { href: "/dashboard/blog",        label: "Blog" },
    { href: "/dashboard/services",    label: "Services" },
    { href: "/dashboard/products",    label: "Products" },
    { href: "/dashboard/newsletter",  label: "Newsletter" },
  ],
  MEDICAL: [
    { href: "/dashboard/medical",     label: "Medical Hub" },
    { href: "/dashboard/leads",       label: "Leads" },
    { href: "/dashboard/projects",    label: "Projects" },
    { href: "/dashboard/assignments", label: "Assignments" },
  ],
  VA: [
    { href: "/dashboard/va",          label: "VA Hub" },
    { href: "/dashboard/assignments", label: "Assignments" },
    { href: "/dashboard/projects",    label: "Projects" },
  ],
  FOUNDATION: [
    { href: "/dashboard/foundation",  label: "Foundation Hub" },
    { href: "/dashboard/assignments", label: "Assignments" },
    { href: "/dashboard/projects",    label: "Projects" },
    { href: "/dashboard/blog",        label: "Blog" },
  ],
  CLIENT: [
    { href: "/dashboard/client",      label: "My Overview" },
    { href: "/dashboard/projects",    label: "My Projects" },
  ],
};

// Quick-action buttons shown per role
const QUICK_ACTIONS = {
  ADMIN: [
    { href: "/dashboard/blog/create",       label: "+ New Post" },
    { href: "/dashboard/projects/create",   label: "+ New Project" },
    { href: "/dashboard/assignments/create",label: "+ Assignment" },
  ],
  FOUNDATION: [
    { href: "/dashboard/blog/create", label: "+ New Post" },
  ],
};

function Sidebar({ user }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const links = NAV_LINKS[user?.role] || [];
  const actions = QUICK_ACTIONS[user?.role] || [];

  return (
    <aside style={{
      width: "240px", minHeight: "100vh", background: "var(--primary)",
      display: "flex", flexDirection: "column",
      position: "fixed", top: 0, left: 0, zIndex: 100,
    }}>
      {/* Header */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <p style={{ color: "#fff", fontWeight: 800, fontSize: "15px", letterSpacing: "-0.3px" }}>Wolbi Royal</p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Enterprise</p>
        </Link>
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <p style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>{user?.first_name || user?.username || "—"}</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "2px" }}>{user?.role}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link key={link.href} href={link.href} style={{
              display: "block", padding: "10px 20px", fontSize: "14px",
              color: active ? "#fff" : "rgba(255,255,255,0.7)",
              background: active ? "rgba(255,255,255,0.12)" : "transparent",
              borderLeft: active ? "3px solid var(--accent)" : "3px solid transparent",
              textDecoration: "none", transition: "all 0.15s",
            }}>
              {link.label}
            </Link>
          );
        })}

        {/* Quick actions */}
        {actions.length > 0 && (
          <div style={{ padding: "12px 16px", marginTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>Quick Add</p>
            {actions.map((a) => (
              <Link key={a.href} href={a.href} style={{
                display: "block", padding: "7px 10px", fontSize: "12px", fontWeight: 600,
                color: "var(--accent)", textDecoration: "none",
                background: "rgba(255,255,255,0.05)", borderRadius: "6px", marginBottom: "6px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                {a.label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", gap: "10px" }}>
        <Link href="/schedule" style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "6px 0" }}>
          📅 Schedule a Call
        </Link>
        <button
          onClick={toggleTheme}
          style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "6px", color: "#fff", padding: "8px 12px", fontSize: "13px", cursor: "pointer", textAlign: "left" }}
        >
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
        <LogoutButton label="Sign Out" />
      </div>
    </aside>
  );
}

function DashboardContent({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.get("/auth/profile/").then((res) => setUser(res.data)).catch(() => {});
  }, []);

  return (
    <div style={{ display: "flex" }}>
      <Sidebar user={user} />
      <main style={{ marginLeft: "240px", flex: 1, minHeight: "100vh", padding: "32px", background: "var(--muted-bg)" }}>
        {children}
      </main>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <ThemeProvider>
      <DashboardContent>{children}</DashboardContent>
    </ThemeProvider>
  );
}
