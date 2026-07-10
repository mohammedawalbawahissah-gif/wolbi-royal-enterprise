"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export default function AIConcierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm the Wolbi concierge. Ask me about our divisions, products, or services and I'll point you the right way." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const nextMessages = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/core/ai-concierge/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: nextMessages.slice(-8) }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: "Sorry, I'm not available right now — please use the contact form instead." }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, something went wrong. Please try the contact form instead." }]);
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Ask Wolbi"
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 1200,
          width: "56px", height: "56px", borderRadius: "50%", border: "none",
          background: "var(--accent)", color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <div style={{
          position: "fixed", bottom: "90px", right: "24px", zIndex: 1200,
          width: "min(360px, calc(100vw - 32px))", height: "min(480px, calc(100vh - 140px))",
          background: "var(--card-bg)", border: "1px solid var(--border)",
          borderRadius: "16px", boxShadow: "var(--shadow-lg)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: "16px", borderBottom: "1px solid var(--border)", background: "var(--primary)", color: "#fff" }}>
            <p style={{ fontWeight: 700, fontSize: "14px" }}>Ask Wolbi</p>
            <p style={{ fontSize: "12px", opacity: 0.8 }}>AI concierge · Wolbi Royal Enterprise</p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "var(--accent)" : "var(--muted-bg)",
                color: m.role === "user" ? "#fff" : "var(--foreground)",
                padding: "8px 12px", borderRadius: "12px", fontSize: "13px",
                lineHeight: 1.5, maxWidth: "85%",
              }}>
                {m.content}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", color: "var(--muted)", fontSize: "13px" }}>Typing…</div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ padding: "12px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Ask about our divisions, products…"
              style={{
                flex: 1, padding: "10px 12px", borderRadius: "999px", border: "1px solid var(--border)",
                background: "var(--input-bg)", color: "var(--foreground)", fontSize: "13px",
              }}
            />
            <button
              onClick={send}
              disabled={loading}
              aria-label="Send"
              style={{
                width: "40px", height: "40px", borderRadius: "50%", border: "none",
                background: "var(--accent)", color: "#fff", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
