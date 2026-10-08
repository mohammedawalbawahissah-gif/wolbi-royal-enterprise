"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Daily.co prebuilt call UI, loaded from their CDN. The join effect depends
 * ONLY on roomUrl + token: parent re-renders (status polling etc.) must never
 * tear the call down. Leaving shows a "you left" screen with Rejoin instead of
 * silently dropping the user back to a form.
 */
export default function TeleconsultationRoom({ roomUrl, token, onLeave, onRejoin }) {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const onLeaveRef = useRef(onLeave);
  const [phase, setPhase] = useState("loading"); // loading | live | left
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => { onLeaveRef.current = onLeave; }, [onLeave]);

  useEffect(() => {
    let disposed = false;
    setPhase("loading");
    setError("");

    const loadScript = () => new Promise((resolve, reject) => {
      if (window.DailyIframe) return resolve();
      const existing = document.querySelector("script[data-daily]");
      if (existing) {
        existing.addEventListener("load", resolve);
        existing.addEventListener("error", () => reject(new Error("Failed to load video library")));
        return;
      }
      const s = document.createElement("script");
      s.src = "https://unpkg.com/@daily-co/daily-js@0.77.0";
      s.async = true;
      s.dataset.daily = "1";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Failed to load video library"));
      document.body.appendChild(s);
    });

    loadScript()
      .then(() => {
        if (disposed || !containerRef.current) return;
        // Reuse a frame if one somehow survived (hot reload / double effect)
        window.DailyIframe.getCallInstance?.()?.destroy();
        const frame = window.DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: true,
          showFullscreenButton: true,
          iframeStyle: { width: "100%", height: "100%", border: "0", borderRadius: "12px" },
        });
        frameRef.current = frame;
        frame.on("joined-meeting", () => !disposed && setPhase("live"));
        frame.on("left-meeting", () => { if (!disposed) { setPhase("left"); onLeaveRef.current?.(); } });
        frame.on("error", (e) => {
          if (disposed) return;
          setError(e?.errorMsg || e?.error?.msg || "The call hit a problem.");
        });
        frame.on("camera-error", () => !disposed && setError("We couldn't access your camera or microphone. Check your browser permissions and rejoin."));
        return frame.join({ url: roomUrl, token });
      })
      .catch((e) => !disposed && setError(e?.errorMsg || e?.message || "Couldn't connect to the call."));

    return () => {
      disposed = true;            // our own cleanup must not look like the user leaving
      const f = frameRef.current;
      frameRef.current = null;
      try { f?.destroy(); } catch { /* already gone */ }
    };
  }, [roomUrl, token, attempt]);

  const box = { padding: "40px 24px", textAlign: "center", color: "var(--muted)" };
  const btn = { padding: "12px 24px", borderRadius: "8px", border: "none", fontWeight: 700, cursor: "pointer", background: "var(--accent)", color: "#fff", margin: "6px" };

  if (error && phase !== "live") {
    return (
      <div style={box}>
        <p style={{ marginBottom: "16px" }}>{error}</p>
        <button style={btn} onClick={() => setAttempt((a) => a + 1)}>Try again</button>
        {onRejoin && <button style={{ ...btn, background: "transparent", color: "var(--foreground)", border: "1px solid var(--border)" }} onClick={onRejoin}>Back</button>}
      </div>
    );
  }

  if (phase === "left") {
    return (
      <div style={box}>
        <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--foreground)", marginBottom: "8px" }}>You&apos;ve left the call</h2>
        <p style={{ marginBottom: "16px", fontSize: "14px" }}>Left by accident? You can jump straight back in.</p>
        <button style={btn} onClick={() => setAttempt((a) => a + 1)}>Rejoin call</button>
        {onRejoin && <button style={{ ...btn, background: "transparent", color: "var(--foreground)", border: "1px solid var(--border)" }} onClick={onRejoin}>Done</button>}
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "min(75vh, 640px)", minHeight: "420px" }}>
      {phase === "loading" && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontSize: "14px" }}>
          Connecting to your call…
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
