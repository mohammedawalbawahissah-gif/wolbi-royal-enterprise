"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Menu, X, Sun, Moon, ChevronDown } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import AIConcierge from "@/components/AIConcierge";

const NAV = [
  { label: "About", href: "/about" },
  {
    label: "Divisions", href: "/divisions",
    children: [
      { label: "Wolbi Technologies",      href: "/divisions/technologies" },
      { label: "Wolbi Medical Services",  href: "/divisions/medical" },
      { label: "Wolbi Virtual Solutions", href: "/divisions/virtual-solutions" },
      { label: "Wolbi Foundation",        href: "/divisions/foundation" },
    ],
  },
  {
    label: "Solutions", href: "/solutions",
    children: [
      { label: "NeomatCare",    href: "/solutions/neomatcare" },
      { label: "FarmaSyst",     href: "/solutions/farmasyst" },
      { label: "MAGHAZ Assist", href: "/solutions/maghaz-assist" },
    ],
  },
  { label: "Industries", href: "/industries" },
  { label: "Projects",   href: "/projects" },
  { label: "Partners",   href: "/partners" },
  { label: "Blog",       href: "/blog" },
  { label: "Schedule",   href: "/schedule" },
  { label: "Contact",    href: "/contact" },
];

function NavItem({ item }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!item.children) {
    return <Link href={item.href} className="nav-link">{item.label}</Link>;
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button className="nav-link" onClick={() => setOpen((o) => !o)}>
        {item.label}
        <ChevronDown size={13} style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0)" }} />
      </button>
      {open && (
        <div className="dropdown-menu">
          <Link href={item.href} className="dropdown-item dropdown-header" onClick={() => setOpen(false)}>
            All {item.label} →
          </Link>
          <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0" }} />
          {item.children.map((child) => (
            <Link key={child.href} href={child.href} className="dropdown-item" onClick={() => setOpen(false)}>
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <style>{`
        .navbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
          transition: all 0.3s ease; padding: 0 1.5rem;
        }
        .navbar.scrolled { background: var(--card-bg); box-shadow: var(--shadow-md); }
        .navbar:not(.scrolled) { background: transparent; }
        .navbar-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          height: 68px;
        }
        .nav-logo { display: flex; flex-direction: column; text-decoration: none; }
        .nav-logo-name { font-size: 15px; font-weight: 800; letter-spacing: -0.3px; color: var(--primary); line-height: 1.1; }
        .navbar:not(.scrolled) .nav-logo-name { color: #fff; }
        .nav-logo-sub { font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); }
        .navbar:not(.scrolled) .nav-logo-sub { color: rgba(255,255,255,0.6); }
        .nav-links { display: flex; align-items: center; gap: 2px; }
        .nav-link {
          display: flex; align-items: center; gap: 4px; padding: 7px 9px; border-radius: 6px;
          font-size: 12.5px; font-weight: 500; color: var(--foreground); text-decoration: none;
          cursor: pointer; transition: color 0.15s; background: none; border: none;
          white-space: nowrap; font-family: inherit;
        }
        .navbar:not(.scrolled) .nav-link { color: rgba(255,255,255,0.9); }
        .nav-link:hover { color: var(--accent); }
        .navbar:not(.scrolled) .nav-link:hover { color: #fff; }
        .dropdown-menu {
          position: absolute; top: calc(100% + 8px); left: 0;
          background: var(--card-bg); border: 1px solid var(--border);
          border-radius: 10px; padding: 6px; min-width: 220px;
          box-shadow: var(--shadow-lg); z-index: 200;
        }
        .dropdown-item { display: block; padding: 9px 12px; border-radius: 6px; font-size: 13px; color: var(--foreground); text-decoration: none; transition: background 0.1s; }
        .dropdown-item:hover { background: var(--muted-bg); color: var(--primary); }
        .dropdown-header { font-weight: 700; color: var(--accent) !important; font-size: 12px; }
        .nav-cta { padding: 8px 16px; background: var(--accent); color: #fff; border-radius: 7px; font-size: 13px; font-weight: 600; text-decoration: none; margin-left: 6px; transition: opacity 0.15s; white-space: nowrap; }
        .nav-cta:hover { opacity: 0.88; }
        .theme-btn { background: none; border: 1px solid var(--border); padding: 6px; border-radius: 7px; cursor: pointer; color: var(--foreground); display: flex; align-items: center; margin-left: 6px; flex-shrink: 0; }
        .navbar:not(.scrolled) .theme-btn { border-color: rgba(255,255,255,0.3); color: #fff; }
        .hamburger { display: none; background: none; border: none; cursor: pointer; color: var(--foreground); padding: 4px; flex-shrink: 0; }
        .navbar:not(.scrolled) .hamburger { color: #fff; }

        /* Mobile menu */
        .mobile-menu {
          position: fixed; top: 68px; left: 0; right: 0; bottom: 0;
          background: var(--card-bg); z-index: 999; overflow-y: auto;
          padding: 0; display: flex; flex-direction: column;
        }
        .mobile-nav-item { border-bottom: 1px solid var(--border); }
        .mobile-link {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 24px; font-size: 16px; font-weight: 600;
          color: var(--foreground); text-decoration: none; width: 100%;
          background: none; border: none; cursor: pointer; font-family: inherit;
          text-align: left;
        }
        .mobile-sub { background: var(--muted-bg); }
        .mobile-sub-link {
          display: block; padding: 12px 32px; font-size: 14px; font-weight: 500;
          color: var(--muted); text-decoration: none; border-bottom: 1px solid var(--border);
        }
        .mobile-sub-link:last-child { border-bottom: none; }
        .mobile-sub-link:hover { color: var(--primary); }
        .mobile-cta {
          display: block; margin: 20px 24px; padding: 14px;
          background: var(--accent); color: #fff; border-radius: 10px;
          font-size: 15px; font-weight: 700; text-align: center; text-decoration: none;
        }
        .mobile-theme {
          margin: 0 24px 24px; padding: 12px;
          background: var(--muted-bg); border: 1px solid var(--border);
          border-radius: 10px; font-size: 14px; font-weight: 600;
          color: var(--foreground); cursor: pointer; width: calc(100% - 48px);
          font-family: inherit;
        }

        @media (max-width: 1020px) {
          .nav-links { display: none; }
          .nav-cta { display: none; }
          .hamburger { display: flex; }
        }
      `}</style>

      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <div className="navbar-inner">
          <Link href="/" className="nav-logo">
            <span className="nav-logo-name">Wolbi Royal</span>
            <span className="nav-logo-sub">Enterprise</span>
          </Link>
          <div className="nav-links">
            {NAV.map((item) => <NavItem key={item.href} item={item} />)}
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <button onClick={toggleTheme} className="theme-btn" aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link href="/contact" className="nav-cta">Get in Touch</Link>
            <button className="hamburger" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="mobile-menu">
          {NAV.map((item) => (
            <div key={item.href} className="mobile-nav-item">
              {item.children ? (
                <>
                  <button
                    className="mobile-link"
                    onClick={() => setMobileExpanded(mobileExpanded === item.href ? null : item.href)}
                  >
                    {item.label}
                    <ChevronDown size={16} style={{ transition: "transform 0.2s", transform: mobileExpanded === item.href ? "rotate(180deg)" : "rotate(0)" }} />
                  </button>
                  {mobileExpanded === item.href && (
                    <div className="mobile-sub">
                      <Link href={item.href} className="mobile-sub-link" onClick={() => setMobileOpen(false)}>
                        All {item.label} →
                      </Link>
                      {item.children.map((c) => (
                        <Link key={c.href} href={c.href} className="mobile-sub-link" onClick={() => setMobileOpen(false)}>
                          {c.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={item.href} className="mobile-link" onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              )}
            </div>
          ))}
          <Link href="/contact" className="mobile-cta" onClick={() => setMobileOpen(false)}>
            Get in Touch
          </Link>
          <button className="mobile-theme" onClick={toggleTheme}>
            {theme === "light" ? "🌙 Switch to Dark Mode" : "☀️ Switch to Light Mode"}
          </button>
        </div>
      )}
    </>
  );
}

function Footer() {
  return (
    <footer style={{ background: "var(--primary)", color: "#fff", padding: "64px 1.5rem 32px" }}>
      <style>{`
        .footer-grid {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px;
        }
        .footer-brand-name { font-size: 18px; font-weight: 800; margin-bottom: 12px; }
        .footer-brand-desc { font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.7; max-width: 280px; }
        .footer-col-title { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.4); margin-bottom: 16px; }
        .footer-link { display: block; font-size: 13px; color: rgba(255,255,255,0.7); text-decoration: none; margin-bottom: 10px; transition: color 0.15s; }
        .footer-link:hover { color: #fff; }
        .footer-bottom {
          max-width: 1200px; margin: 48px auto 0; padding-top: 24px;
          border-top: 1px solid rgba(255,255,255,0.1);
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 12px;
        }
        .footer-bottom-text { font-size: 12px; color: rgba(255,255,255,0.4); }
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr; gap: 28px; }
        }
      `}</style>
      <div className="footer-grid">
        <div>
          <p className="footer-brand-name">Wolbi Royal Enterprise</p>
          <p className="footer-brand-desc">Technology, healthcare, virtual solutions, and community impact — building Africa's future through purposeful innovation rooted in lived experience.</p>
        </div>
        <div>
          <p className="footer-col-title">Divisions</p>
          {[["Technologies","/divisions/technologies"],["Medical Services","/divisions/medical"],["Virtual Solutions","/divisions/virtual-solutions"],["Foundation","/divisions/foundation"]].map(([l,h]) => <Link key={h} href={h} className="footer-link">{l}</Link>)}
        </div>
        <div>
          <p className="footer-col-title">Solutions</p>
          {[["NeomatCare","/solutions/neomatcare"],["FarmaSyst","/solutions/farmasyst"],["MAGHAZ Assist","/solutions/maghaz-assist"]].map(([l,h]) => <Link key={h} href={h} className="footer-link">{l}</Link>)}
        </div>
        <div>
          <p className="footer-col-title">Company</p>
          {[["About","/about"],["Founder","/founder"],["Partners","/partners"],["Projects","/projects"],["Blog","/blog"],["Schedule a Call","/schedule"],["Contact","/contact"]].map(([l,h]) => <Link key={h} href={h} className="footer-link">{l}</Link>)}
        </div>
      </div>
      <div className="footer-bottom">
        <p className="footer-bottom-text">© {new Date().getFullYear()} Wolbi Royal Enterprise. All rights reserved.</p>
        <p className="footer-bottom-text">Tamale, Ghana · wolbiroyal.com</p>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <AIConcierge />
    </>
  );
}
