"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";

const NAV_LINKS = {
  ADMIN: [
    { href: "/dashboard/admin",       label: "Overview" },
    { href: "/dashboard/leads",       label: "Leads" },
    { href: "/dashboard/teleconsultations", label: "Teleconsultations" },
    { href: "/dashboard/projects",    label: "Projects" },
    { href: "/dashboard/assignments", label: "Assignments" },
    { href: "/dashboard/blog",        label: "Blog" },
    { href: "/dashboard/services",    label: "Services" },
    { href: "/dashboard/products",    label: "Products" },
    { href: "/dashboard/newsletter",  label: "Newsletter" },
    { href: "/dashboard/users",       label: "Users & Staff" },
  ],
  MEDICAL: [
    { href: "/dashboard/medical",     label: "Medical Hub" },
    { href: "/dashboard/teleconsultations", label: "Teleconsultations" },
    { href: "/dashboard/leads",       label: "Leads" },
    { href: "/dashboard/projects",    label: "Projects" },
    { href: "/dashboard/assignments", label: "Assignments" },
  ],
  VA: [
    { href: "/dashboard/va",          label: "VA Hub" },
    { href: "/dashboard/teleconsultations", label: "Teleconsultations" },
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

const QUICK_ACTIONS = {
  ADMIN: [
    { href: "/dashboard/users/create",      label: "+ Add Staff" },
    { href: "/dashboard/blog/create",       label: "+ New Post" },
    { href: "/dashboard/projects/create",   label: "+ New Project" },
    { href: "/dashboard/assignments/create",label: "+ Assignment" },
  ],
  FOUNDATION: [
    { href: "/dashboard/blog/create", label: "+ New Post" },
  ],
};

function Sidebar({ user, open, onClose }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const links = NAV_LINKS[user?.role] || [];
  const actions = QUICK_ACTIONS[user?.role] || [];

  return (
    <aside className={`dash-sidebar${open ? " open" : ""}`} style={{
      width: "240px", background: "var(--primary)",
      display: "flex", flexDirection: "column",
      position: "fixed", top: 0, left: 0, zIndex: 100,
      overflow: "hidden", /* the aside itself never scrolls — only the nav area below does */
    }}>
      {/* Header — fixed, never scrolls */}
      <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
        <button className="dash-close" onClick={onClose} aria-label="Close menu">
          <X size={20} />
        </button>
        <Link href="/" style={{ textDecoration: "none" }}>
          <p style={{ color: "#fff", fontWeight: 800, fontSize: "15px", letterSpacing: "-0.3px" }}>Wolbi Royal</p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase" }}>Enterprise</p>
        </Link>
        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <p style={{ color: "#fff", fontSize: "13px", fontWeight: 600 }}>{user?.first_name || user?.username || "—"}</p>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "11px", marginTop: "2px" }}>{user?.role}</p>
        </div>
      </div>

      {/* Navigation — THIS scrolls if content is taller than the viewport */}
      <nav style={{
        flex: "1 1 auto", minHeight: 0, padding: "12px 0", overflowY: "auto",
        scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.25) transparent",
      }}>
        <style>{`
          nav::-webkit-scrollbar { width: 6px; }
          nav::-webkit-scrollbar-track { background: transparent; }
          nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
          nav::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.35); }
        `}</style>
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link key={link.href} href={link.href} onClick={onClose} style={{
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

        {actions.length > 0 && (
          <div style={{ padding: "12px 16px", marginTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "8px" }}>Quick Add</p>
            {actions.map((a) => (
              <Link key={a.href} href={a.href} onClick={onClose} style={{
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

      {/* Footer — fixed, ALWAYS visible regardless of nav scroll position */}
      <div style={{
        padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)",
        display: "flex", flexDirection: "column", gap: "10px", flexShrink: 0,
      }}>
        <Link href="/schedule" style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "6px 0" }}>
          📅 Schedule a Call
        </Link>
        <button
          onClick={toggleTheme}
          style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "6px", color: "#fff", padding: "8px 12px", fontSize: "13px", cursor: "pointer", textAlign: "left" }}
        >
          {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
        </button>
        <LogoutButton label="Sign Out" className="dash-signout" />
      </div>
    </aside>
  );
}

function DashboardContent({ children }) {
  const [user, setUser] = useState(null);
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    api.get("/auth/profile/").then((res) => setUser(res.data)).catch(() => {});
  }, []);

  // Close the drawer after navigating
  useEffect(() => { setNavOpen(false); }, [pathname]);

  // Escape closes it; lock page scroll while it is open
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setNavOpen(false); };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [navOpen]);

  return (
    <div style={{ display: "flex" }}>
      <style>{`
        .dash-sidebar { height: 100vh; height: 100dvh; }
        .dash-main { margin-left: 240px; flex: 1; min-width: 0; min-height: 100vh; padding: 20px 32px 32px; background: var(--muted-bg); }
        .dash-topbar { display: flex; align-items: center; justify-content: flex-end; gap: 12px; margin-bottom: 12px; }
        .dash-menu-btn, .dash-close { display: none; }
        .dash-backdrop { display: none; }
        .dash-brand { display: none; }
        .dash-signout { color: rgba(255,255,255,0.85) !important; text-align: left; font-size: 13px; padding: 6px 0 !important; }

        /* Tablet and phone: sidebar becomes a slide-in drawer */
        @media (max-width: 1023px) {
          .dash-sidebar {
            width: min(280px, 86vw) !important;
            transform: translateX(-100%); visibility: hidden;
            transition: transform 0.25s ease, visibility 0s linear 0.25s;
          }
          .dash-sidebar.open {
            transform: none; visibility: visible;
            transition: transform 0.25s ease, visibility 0s;
            box-shadow: 8px 0 30px rgba(0,0,0,0.35);
          }
          .dash-backdrop.open { display: block; position: fixed; inset: 0; background: rgba(15,23,42,0.5); z-index: 90; }
          .dash-main { margin-left: 0; padding: 0 20px 28px; }
          .dash-topbar {
            position: sticky; top: 0; z-index: 80; justify-content: space-between;
            margin: 0 -20px 16px; padding: 10px 20px;
            background: var(--muted-bg); border-bottom: 1px solid var(--border);
          }
          .dash-menu-btn {
            display: flex; align-items: center; justify-content: center;
            width: 40px; height: 40px; border-radius: 10px; cursor: pointer;
            border: 1px solid var(--border); background: var(--card-bg); color: var(--foreground);
          }
          .dash-brand { display: block; font-size: 14px; font-weight: 800; color: var(--primary); }
          .dash-close {
            display: flex; align-items: center; justify-content: center;
            position: absolute; top: 14px; right: 12px; width: 36px; height: 36px;
            background: rgba(255,255,255,0.1); border: none; border-radius: 8px; color: #fff; cursor: pointer;
          }
          .dash-sidebar a, .dash-sidebar button { min-height: 44px; }
        }
        @media (max-width: 480px) {
          .dash-main { padding: 0 14px 24px; }
          .dash-topbar { margin: 0 -14px 14px; padding: 8px 14px; }
        }
      `}</style>
      <div className={`dash-backdrop${navOpen ? " open" : ""}`} onClick={() => setNavOpen(false)} aria-hidden="true" />
      <Sidebar user={user} open={navOpen} onClose={() => setNavOpen(false)} />
      <main className="dash-main">
        <div className="dash-topbar">
          <button className="dash-menu-btn" onClick={() => setNavOpen(true)} aria-label="Open menu" aria-expanded={navOpen}>
            <Menu size={20} />
          </button>
          <span className="dash-brand">Wolbi Royal</span>
          {user && <NotificationBell />}
        </div>
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
