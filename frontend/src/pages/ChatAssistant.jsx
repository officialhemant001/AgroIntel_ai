import React, { useState, useRef, useEffect, useContext } from "react";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { LanguageContext } from "../context/LanguageContext";
import { sendChatMessage, getChatHistory } from "../services/api";
import "../styles/dashboard.css";
import "../styles/pages.css";

export default function ChatAssistant() {
  const { lang } = useContext(LanguageContext);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      message:
        lang === "hi"
          ? "नमस्ते! मैं AgroIntel AI हूँ 🌱 आपकी फसल से जुड़े किसी भी सवाल में मदद कर सकता हूँ।"
          : "Hello! I'm AgroIntel AI 🌱 Ask me anything about crop diseases, fertilizers, pests, or farming tips!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const result = await getChatHistory("", 30);
        if (result.success && result.data?.messages?.length > 0) {
          setMessages((prev) => [prev[0], ...result.data.messages]);
        }
      } catch (err) {
        console.warn("Chat history load failed:", err);
      }
    }
    loadHistory();
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    // Add user message
    const userMsg = { role: "user", message: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const result = await sendChatMessage(trimmed, lang);

      if (result.success) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", message: result.data.response },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            message: "Sorry, I couldn't process your request. Please try again.",
          },
        ]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          message:
            "⚠️ Unable to connect to AI service. Please check if the backend is running.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = lang === "hi"
    ? [
        "मेरी फसल में कौन सी बीमारी है?",
        "कौन सा उर्वरक इस्तेमाल करूं?",
        "कीट नियंत्रण कैसे करें?",
      ]
    : [
        "What disease does my crop have?",
        "Which fertilizer should I use?",
        "How to control pests naturally?",
      ];

  return (
    <div className="page-layout">
      <Sidebar />

      <div className="page-body">
        <Navbar />

        <div className="page-inner" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - var(--navbar-height))", padding: "0" }}>
          {/* Chat Header */}
          <div
            style={{
              padding: "20px 32px",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <h1 style={{ fontSize: "24px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
              🤖 AI Chat Assistant
            </h1>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>
              {lang === "hi"
                ? "कृषि से जुड़े सवाल पूछें — रोग, उर्वरक, कीट नियंत्रण"
                : "Ask farming questions — disease, fertilizer, pest control"}
            </p>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "24px 32px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                  animation: "fadeIn 0.3s ease",
                }}
              >
                <div
                  style={{
                    maxWidth: "75%",
                    padding: "14px 18px",
                    borderRadius:
                      msg.role === "user"
                        ? "var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)"
                        : "var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px",
                    background:
                      msg.role === "user"
                        ? "linear-gradient(135deg, var(--primary-dark), var(--primary))"
                        : "var(--bg-surface)",
                    color:
                      msg.role === "user"
                        ? "var(--text-inverse)"
                        : "var(--text-primary)",
                    border:
                      msg.role === "user"
                        ? "none"
                        : "1px solid var(--border-subtle)",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  {msg.role === "assistant" && (
                    <span
                      style={{
                        display: "inline-block",
                        marginRight: "6px",
                        fontSize: "16px",
                      }}
                    >
                      🌱
                    </span>
                  )}
                  {msg.message}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: "var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-subtle)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--text-muted)",
                    fontSize: "14px",
                  }}
                >
                  <span style={{ animation: "pulse 1s ease-in-out infinite" }}>🌱</span>
                  AI is thinking...
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && (
            <div
              style={{
                padding: "0 32px 12px",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(s);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  style={{
                    padding: "8px 16px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "var(--radius-full)",
                    color: "var(--text-secondary)",
                    fontSize: "12px",
                    cursor: "pointer",
                    transition: "all var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = "var(--primary)";
                    e.target.style.color = "var(--primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = "var(--border-default)";
                    e.target.style.color = "var(--text-secondary)";
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div
            style={{
              padding: "16px 32px",
              borderTop: "1px solid var(--border-subtle)",
              background: "rgba(6, 14, 9, 0.85)",
              backdropFilter: "blur(16px)",
              display: "flex",
              gap: "12px",
              alignItems: "flex-end",
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                lang === "hi"
                  ? "अपना सवाल यहाँ लिखें..."
                  : "Type your farming question..."
              }
              rows={1}
              style={{
                flex: 1,
                padding: "12px 16px",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                color: "var(--text-primary)",
                fontSize: "14px",
                resize: "none",
                minHeight: "44px",
                maxHeight: "120px",
                transition: "border-color var(--transition-fast)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--primary)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
              id="chat-input"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                padding: "12px 24px",
                background: input.trim()
                  ? "linear-gradient(135deg, var(--primary-dark), var(--primary))"
                  : "var(--bg-surface)",
                color: input.trim() ? "var(--text-inverse)" : "var(--text-muted)",
                border: input.trim() ? "none" : "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                fontSize: "14px",
                fontWeight: "600",
                cursor: input.trim() ? "pointer" : "not-allowed",
                transition: "all var(--transition-base)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                minHeight: "44px",
              }}
              id="chat-send-btn"
            >
              {loading ? "⏳" : "🚀"} Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
