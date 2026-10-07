"use client";

const STATUS = {
  LIVE:        { label: "Live",        color: "#16a34a" },
  BETA:        { label: "Beta",        color: "#d97706" },
  COMING_SOON: { label: "Coming soon", color: "#64748b" },
};

export function AppCard({ app }) {
  const status = STATUS[app.status] || STATUS.LIVE;
  const soon = app.status === "COMING_SOON";
  const accent = app.color || "#1e3a5f";

  const body = (
    <>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "16px" }}>
        <span aria-hidden="true" style={{
          width: "52px", height: "52px", borderRadius: "14px", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "26px", background: `${accent}18`, border: `1px solid ${accent}33`,
        }}>
          {app.icon || app.name.charAt(0)}
        </span>
        <span style={{
          fontSize: "10px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase",
          color: status.color, border: `1px solid ${status.color}33`, background: `${status.color}12`,
          padding: "2px 8px", borderRadius: "999px", whiteSpace: "nowrap",
        }}>
          {status.label}
        </span>
      </div>

      {app.category && (
        <p style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: accent, marginBottom: "6px" }}>
          {app.category}
        </p>
      )}
      <p style={{ fontWeight: 700, fontSize: "18px", marginBottom: "6px" }}>{app.name}</p>
      <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.6, flex: 1 }}>{app.tagline}</p>

      <p style={{ marginTop: "18px", fontSize: "13px", fontWeight: 600, color: soon ? "var(--muted)" : "var(--accent)" }}>
        {soon ? "Launching soon" : app.open_in_new_tab ? "Open app ↗" : "Open app →"}
      </p>
    </>
  );

  const cardStyle = {
    display: "flex", flexDirection: "column", padding: "24px", height: "100%",
    background: "var(--card-bg)", border: "1px solid var(--border)",
    borderTop: `3px solid ${accent}`, borderRadius: "14px", boxShadow: "var(--shadow)",
    color: "var(--foreground)", opacity: soon ? 0.75 : 1,
  };

  if (soon) return <div style={cardStyle}>{body}</div>;

  return (
    <a
      href={app.url}
      {...(app.open_in_new_tab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="app-card"
      style={{ ...cardStyle, textDecoration: "none" }}
    >
      {body}
    </a>
  );
}

export function AppGrid({ apps }) {
  return (
    <>
      <style>{`
        .app-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }
        .app-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg) !important; }
        .app-card:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
      `}</style>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
        {apps.map((a) => <AppCard key={a.id} app={a} />)}
      </div>
    </>
  );
}
