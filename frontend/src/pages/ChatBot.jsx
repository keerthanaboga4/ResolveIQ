import React, { useState } from "react";
import axios from "axios";
import { Send, MessageCircle } from "lucide-react";
import { API_URL } from "../api";
import { useLanguage } from "../LanguageContext";

export default function ChatBot() {
  const { lang, t } = useLanguage();
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const suggestions = [
    t.chatPlaceholder,
    "Which department has the most pending complaints?",
    "Are there any high-risk officers right now?",
  ];

  const sendQuestion = async (question) => {
    if (!question.trim()) return;
    setChatQuestion("");
    setChatHistory((prev) => [...prev, { role: "user", text: question }]);
    setChatLoading(true);

    try {
      const res = await axios.post(
        `${API_URL}/chatbot?question=${encodeURIComponent(question)}&language=${lang}`
      );
      setChatHistory((prev) => [...prev, { role: "bot", text: res.data.answer }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: "bot", text: t.error }]);
    }
    setChatLoading(false);
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    sendQuestion(chatQuestion);
  };

  return (
    <main className="shell shell-narrow">
      <section className="card card-chat-page">
        <h2 className="card-title">
          <MessageCircle />
          {t.askResolveIQ}
        </h2>
        <p className="card-sub">{t.askSub}</p>

        {chatHistory.length === 0 && (
          <div className="chip-row">
            {suggestions.map((s, i) => (
              <button key={i} type="button" className="chip" onClick={() => sendQuestion(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="chat-window">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
              <span className={`chat-avatar chat-avatar-${msg.role}`}>
                {msg.role === "user" ? "You" : "RQ"}
              </span>
              <span className="chat-bubble">{msg.text}</span>
            </div>
          ))}
          {chatLoading && (
            <div className="chat-msg chat-msg-bot">
              <span className="chat-avatar chat-avatar-bot">RQ</span>
              <span className="chat-bubble">{t.thinking}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleChatSubmit} className="chat-form">
          <textarea
            value={chatQuestion}
            onChange={(e) => setChatQuestion(e.target.value)}
            placeholder={t.chatPlaceholder}
            rows={2}
          />
          <button type="submit" disabled={chatLoading}>
            <Send size={15} />
            {chatLoading ? t.thinking : t.ask}
          </button>
        </form>
      </section>
    </main>
  );
}