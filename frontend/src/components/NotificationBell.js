"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import api from "@/lib/api";

const POLL_MS = 30000;

export const KIND_META = {
  LEAD:             { label: "Request",       color: "#1e3a5f" },
  LEAD_ESCALATION:  { label: "Ask Wolbi",     color: "#7c3aed" },
  TELECONSULTATION: { label: "Teleconsult",   color: "#16a34a" },
  VOLUNTEER:        { label: "Volunteer",     color: "#d97706" },
  ASSIGNMENT:       { label: "Assignment",    color: "#2563eb" },
  COMMENT:          { label: "Comment",       color: "#64748b" },
  SYSTEM:           { label: "System",        color: "#64748b" },
};

export function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function KindTag({ kind }) {
  const meta = KIND_META[kind] || KIND_META.SYSTEM;
  return (
    <span style={{
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
      color: meta.color, border: `1px solid ${meta.color}33`, background: `${meta.color}12`,
      padding: "1px 6px", borderRadius: "4px", whiteSpace: "nowrap",
    }}>
      {meta.label}
    </span>
  );
}

export default function NotificationBell() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null);
  const wrapRef = useRef(null);

  const refreshCount = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count/");
      setUnread(res.data.unread || 0);
    } catch { /* offline or logged out — keep last value */ }
  }, []);

  // Poll the unread count, pausing while the tab is hidden
  useEffect(() => {
    refreshCount();
    let timer = setInterval(() => { if (!document.hidden) refreshCount(); }, POLL_MS);
    const onVisible = () => { if (!document.hidden) refreshCount(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [refreshCount]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      try {
        const res = await api.get("/notifications/");
        setItems((res.data.results || res.data).slice(0, 8));
      } catch { setItems([]); }
      refreshCount();
    }
  };

  const openItem = async (n) => {
    setOpen(false);
    if (!n.is_read) {
      setUnread((u) => Math.max(0, u - 1));
      setItems((list) => list?.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      api.patch(`/notifications/${n.id}/read/`).catch(() => {});
    }
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    setUnread(0);
    setItems((list) => list?.map((x) => ({ ...x, is_read: true })));
    try { await api.post("/notifications/read-all/"); } catch { refreshCount(); }
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        style={{
          position: "relative", width: "40px", height: "40px", borderRadius: "10px",
          border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--foreground)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span style={{
            position: "absolute", top: "-5px", right: "-5px", minWidth: "18px", height: "18px",
            padding: "0 5px", borderRadius: "9px", background: "#e11d48", color: "#fff",
            fontSize: "11px", fontWeight: 700, lineHeight: "18px", textAlign: "center",
            border: "2px solid var(--muted-bg)",
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div role="menu" style={{
          position: "absolute", right: 0, top: "48px", width: "min(380px, calc(100vw - 32px))",
          background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "12px",
          boxShadow: "var(--shadow-lg)", zIndex: 500, overflow: "hidden",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontWeight: 700, fontSize: "14px" }}>Notifications</p>
            {unread > 0 && (
              <button onClick={markAll} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {items === null && <p style={{ padding: "24px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>Loading…</p>}
            {items?.length === 0 && (
              <p style={{ padding: "32px 24px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>
                You&apos;re all caught up.
              </p>
            )}
            {items?.map((n) => (
              <button key={n.id} onClick={() => openItem(n)} style={{
                display: "flex", gap: "10px", width: "100%", textAlign: "left", padding: "12px 16px",
                background: n.is_read ? "transparent" : "rgba(22,163,74,0.06)", border: "none",
                borderBottom: "1px solid var(--border)", cursor: "pointer", color: "var(--foreground)",
              }}>
                <span style={{
                  width: "8px", height: "8px", borderRadius: "50%", marginTop: "6px", flexShrink: 0,
                  background: n.is_read ? "transparent" : "var(--accent)",
                }} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "3px" }}>
                    <KindTag kind={n.kind} />
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{timeAgo(n.created_at)}</span>
                  </span>
                  <span style={{ display: "block", fontSize: "13px", fontWeight: n.is_read ? 500 : 700, lineHeight: 1.4 }}>{n.title}</span>
                  <span style={{ display: "block", fontSize: "12px", color: "var(--muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.message}</span>
                </span>
              </button>
            ))}
          </div>

          <Link href="/dashboard/notifications" onClick={() => setOpen(false)} style={{
            display: "block", padding: "11px", textAlign: "center", fontSize: "13px", fontWeight: 600,
            color: "var(--primary)", textDecoration: "none", background: "var(--muted-bg)",
          }}>
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
