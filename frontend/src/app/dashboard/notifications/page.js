"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import { KindTag, timeAgo } from "@/components/NotificationBell";

function NotificationsContent() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState([]);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState(null);
  const [savingPrefs, setSavingPrefs] = useState(false);

  const load = async (url, append = false) => {
    setLoading(true);
    try {
      const res = await api.get(url);
      const results = res.data.results || res.data;
      setItems((prev) => (append ? [...prev, ...results] : results));
      setNext(res.data.next || null);
    } catch { if (!append) setItems([]); }
    setLoading(false);
  };

  useEffect(() => {
    load(filter === "unread" ? "/notifications/?unread=1" : "/notifications/");
  }, [filter]);

  useEffect(() => {
    api.get("/notifications/preferences/").then((r) => setPrefs(r.data)).catch(() => {});
  }, []);

  const open = (n) => {
    if (!n.is_read) {
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      api.patch(`/notifications/${n.id}/read/`).catch(() => {});
    }
    if (n.link) router.push(n.link);
  };

  const markAll = async () => {
    await api.post("/notifications/read-all/").catch(() => {});
    setItems((list) => (filter === "unread" ? [] : list.map((x) => ({ ...x, is_read: true }))));
  };

  const toggleEmail = async () => {
    setSavingPrefs(true);
    try {
      const res = await api.patch("/notifications/preferences/", { email_notifications: !prefs.email_notifications });
      setPrefs(res.data);
    } catch { /* keep previous */ }
    setSavingPrefs(false);
  };

  const tab = (key, label) => (
    <button onClick={() => setFilter(key)} style={{
      padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
      border: "1px solid var(--border)",
      background: filter === key ? "var(--primary)" : "var(--card-bg)",
      color: filter === key ? "#fff" : "var(--foreground)",
    }}>{label}</button>
  );

  return (
    <div style={{ maxWidth: "820px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "4px" }}>Notifications</h1>
      <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "24px" }}>
        New requests, bookings, teleconsultations and assignments for you.
      </p>

      {prefs && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap",
          background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "12px",
          padding: "16px 20px", marginBottom: "20px",
        }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: "14px" }}>Email me these notifications</p>
            <p style={{ color: "var(--muted)", fontSize: "13px", marginTop: "2px" }}>
              {prefs.email
                ? `Copies go to ${prefs.email}. Comments stay in-app only.`
                : "Your account has no email address — ask an admin to add one."}
            </p>
          </div>
          <button
            onClick={toggleEmail}
            disabled={savingPrefs || !prefs.email}
            role="switch"
            aria-checked={prefs.email_notifications}
            style={{
              width: "48px", height: "28px", borderRadius: "14px", border: "none", position: "relative",
              background: prefs.email_notifications && prefs.email ? "var(--accent)" : "var(--border)",
              cursor: prefs.email ? "pointer" : "not-allowed", transition: "background 0.15s",
            }}
          >
            <span style={{
              position: "absolute", top: "3px", left: prefs.email_notifications && prefs.email ? "23px" : "3px",
              width: "22px", height: "22px", borderRadius: "50%", background: "#fff", transition: "left 0.15s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
        {tab("all", "All")}
        {tab("unread", "Unread")}
        <button onClick={markAll} style={{
          marginLeft: "auto", background: "none", border: "none", color: "var(--accent)",
          fontSize: "13px", fontWeight: 600, cursor: "pointer",
        }}>Mark all as read</button>
      </div>

      <div style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
        {!loading && items.length === 0 && (
          <p style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)", fontSize: "14px" }}>
            {filter === "unread" ? "No unread notifications." : "No notifications yet."}
          </p>
        )}
        {items.map((n) => (
          <button key={n.id} onClick={() => open(n)} style={{
            display: "flex", gap: "12px", width: "100%", textAlign: "left", padding: "16px 20px",
            background: n.is_read ? "transparent" : "rgba(22,163,74,0.06)", border: "none",
            borderBottom: "1px solid var(--border)", cursor: n.link ? "pointer" : "default", color: "var(--foreground)",
          }}>
            <span style={{
              width: "8px", height: "8px", borderRadius: "50%", marginTop: "7px", flexShrink: 0,
              background: n.is_read ? "transparent" : "var(--accent)",
            }} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                <KindTag kind={n.kind} />
                <span style={{ fontSize: "12px", color: "var(--muted)" }} title={new Date(n.created_at).toLocaleString()}>
                  {timeAgo(n.created_at)}
                </span>
              </span>
              <span style={{ display: "block", fontSize: "14px", fontWeight: n.is_read ? 500 : 700 }}>{n.title}</span>
              <span style={{ display: "block", fontSize: "13px", color: "var(--muted)", marginTop: "3px", lineHeight: 1.5 }}>{n.message}</span>
            </span>
          </button>
        ))}
        {loading && <p style={{ padding: "20px", textAlign: "center", color: "var(--muted)", fontSize: "13px" }}>Loading…</p>}
      </div>

      {next && !loading && (
        <button onClick={() => load(next, true)} style={{
          marginTop: "16px", padding: "10px 20px", borderRadius: "8px", border: "1px solid var(--border)",
          background: "var(--card-bg)", color: "var(--foreground)", fontWeight: 600, fontSize: "13px", cursor: "pointer",
        }}>Load more</button>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsContent />
    </ProtectedRoute>
  );
}
