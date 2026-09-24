"use client";

/**
 * Telegram Mini App — minimal chat UI.
 *
 * Opens inside Telegram via the WebApp SDK (deep link / inline button).
 * Talks to the bot backend at /api/telegram/update with initData attached;
 * the backend verifies the HMAC signature server-side.
 */

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready: () => void;
        initData: string;
        initDataUnsafe?: {
          user?: { id: number; first_name?: string; username?: string };
        };
        close: () => void;
        setHeaderColor?: (c: string) => void;
      };
    };
  }
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STREAM_URL = "/api/telegram/update";

export default function TelegramMiniApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [initData, setInitData] = useState("");
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      setInitData(tg.initData || "");
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `👋 Hi ${user.first_name || "there"}! Send a message to chat through your OmniRoute gateway.`,
          },
        ]);
      }
    } else {
      setError("This page must be opened inside the Telegram Mini App.");
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const res = await fetch(STREAM_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData,
          message: text,
        }),
      });
      const data = (await res.json().catch(() => null)) as {
        reply?: string;
        error?: string;
      } | null;
      const reply = data?.reply || data?.error || "⚠️ No reply from gateway.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `⚠️ Network error: ${(err as Error).message}` },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 480,
        margin: "0 auto",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <h1 style={{ fontSize: 18, margin: "0 0 12px" }}>OmniRoute Mini App</h1>
      {error && (
        <p style={{ color: "var(--color-error)", fontSize: 13, margin: "0 0 12px" }}>{error}</p>
      )}

      <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              margin: "6px 0",
              padding: "8px 12px",
              borderRadius: 12,
              background: m.role === "user" ? "var(--color-contrast)" : "var(--color-bg-subtle)",
              color: m.role === "user" ? "var(--color-contrast-fg)" : "var(--color-text-main)",
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask anything…"
          disabled={busy}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid var(--color-border-strong)",
            fontSize: 15,
          }}
        />
        <button
          onClick={send}
          disabled={busy || !input.trim()}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            border: "none",
            background: "var(--color-contrast)",
            color: "var(--color-contrast-fg)",
            fontSize: 15,
            cursor: busy ? "default" : "pointer",
          }}
        >
          {busy ? "…" : "Send"}
        </button>
      </div>
    </main>
  );
}
