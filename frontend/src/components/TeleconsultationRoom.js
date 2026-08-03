"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Loads Daily.co's prebuilt call UI (video + built-in text chat +
 * screenshare) via their CDN script rather than an npm dependency, so this
 * doesn't touch package.json/lock files. Renders into a fixed-height frame.
 */
export default function TeleconsultationRoom({ roomUrl, token, onLeave }) {
  const containerRef = useRef(null);
  const callFrameRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    function loadScript() {
      return new Promise((resolve, reject) => {
        if (window.DailyIframe) return resolve();
        const script = document.createElement("script");
        script.src = "https://unpkg.com/@daily-co/daily-js";
        script.async = true;
        script.onload = resolve;
        script.onerror = () => reject(new Error("Failed to load video library"));
        document.body.appendChild(script);
      });
    }

    loadScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        const frame = window.DailyIframe.createFrame(containerRef.current, {
          showLeaveButton: true,
          iframeStyle: { width: "100%", height: "100%", border: "0", borderRadius: "12px" },
        });
        callFrameRef.current = frame;
        frame.on("left-meeting", () => onLeave?.());
        frame.join({ url: roomUrl, token }).then(() => !cancelled && setReady(true));
      })
      .catch((e) => setError(e.message));

    return () => {
      cancelled = true;
      callFrameRef.current?.destroy();
    };
  }, [roomUrl, token, onLeave]);

  if (error) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>
        Couldn't load the video call: {error}. Please refresh and try again.
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: "min(70vh, 600px)" }}>
      {!ready && (
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", color: "var(--muted)", fontSize: "14px",
        }}>
          Connecting to your call…
        </div>
      )}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
