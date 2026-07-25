import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import "./App.css";

const API_URL = "https://resolveiq-backend-312937988421.us-central1.run.app";

function App() {
  const { t, i18n } = useTranslation();

  const [complaintText, setComplaintText] = useState("");
  const [complaintLanguage, setComplaintLanguage] = useState(i18n.language);
  const [submitResult, setSubmitResult] = useState(null);
  const [grievances, setGrievances] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Sync complaint language default when UI language changes
  useEffect(() => {
    setComplaintLanguage(i18n.language);
  }, [i18n.language]);

  const fetchAllData = async () => {
    try {
      const [grievancesRes, statsRes, hotspotsRes] = await Promise.all([
        axios.get(`${API_URL}/get-grievances`),
        axios.get(`${API_URL}/category-stats`),
        axios.get(`${API_URL}/smart-hotspots`),
      ]);
      setGrievances(grievancesRes.data);
      setCategoryStats(statsRes.data);
      setHotspots(hotspotsRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/submit-grievance?text=${encodeURIComponent(complaintText)}&language=${complaintLanguage}`
      );
      setSubmitResult(res.data);
      setComplaintText("");
      fetchAllData();
    } catch (err) {
      console.error("Error submitting grievance:", err);
      setSubmitResult({ error: t("error_generic") });
    }
    setLoading(false);
  };

   const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatQuestion.trim()) return;

    setChatLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/chatbot?question=${encodeURIComponent(chatQuestion)}&language=${complaintLanguage}`
      );
      setChatAnswer(res.data.answer);
    } catch (err) {
      setChatAnswer("Something went wrong. Try again.");
    }
    setChatLoading(false);
  };

  const totalComplaints = grievances.length;
  const pendingCount = grievances.filter((g) => g.status === "Pending").length;

  return (
    <div className="app">
      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark" />
            <span className="brand-name">{t("brand_name")}</span>
          </div>
          <span className="brand-tagline">{t("brand_tagline")}</span>

          {/* UI Language switcher */}
          <div className="lang-switcher">
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="lang-select"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="hi">हिंदी (Hindi)</option>
            </select>
          </div>
        </div>
      </header>

      <main className="shell">
        {/* Hero / Stats strip */}
        <section className="stats-strip">
          <div className="stat">
            <span className="stat-value">{totalComplaints}</span>
            <span className="stat-label">{t("stat_total")}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">{t("stat_pending")}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{categoryStats.length}</span>
            <span className="stat-label">{t("stat_categories")}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{hotspots.length}</span>
            <span className="stat-label">{t("stat_hotspots")}</span>
          </div>
        </section>

        {/* Submit Form */}
        <section className="card card-submit">
          <h2 className="card-title">{t("file_complaint")}</h2>
          <p className="card-sub">{t("file_complaint_sub")}</p>
          <form onSubmit={handleSubmit}>
            {/* Complaint language selector */}
            <div className="form-group">
              <label className="form-label">{t("complaint_language")}</label>
              <select
                value={complaintLanguage}
                onChange={(e) => setComplaintLanguage(e.target.value)}
                className="form-select"
              >
                <option value="en">English</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="hi">हिंदी (Hindi)</option>
              </select>
            </div>

            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder={t("complaint_placeholder")}
              rows={5}
            />
            <button type="submit" disabled={loading}>
              {loading ? t("classifying") : t("submit_button")}
            </button>
          </form>

          {submitResult && (
            <div className={`result-banner ${submitResult.error ? "result-error" : "result-ok"}`}>
              {submitResult.error ? (
                <span>{submitResult.error}</span>
              ) : (
                <>
                  <span className="result-label">{t("classified_as")}</span>
                  <span className="result-category">{submitResult.category}</span>
                </>
              )}
            </div>
          )}
        </section>

        {/* Hotspots */}
        <section className="card card-hotspots">
          <h2 className="card-title">
            <span className="pulse-dot" />
            {t("hotspots_title")}
          </h2>
          {hotspots.length === 0 ? (
            <p className="empty-state">{t("hotspots_empty")}</p>
          ) : (
            <div className="hotspot-list">
             {hotspots.map((h, i) => (
  <div className="hotspot-row" key={i}>
    <span className="hotspot-category">{h.category} — {h.location}</span>
    <div className="hotspot-bar-track">
      <div
        className="hotspot-bar-fill"
        style={{ width: `${Math.min(h.complaint_count * 20, 100)}%` }}
      />
    </div>
    <span className="hotspot-count">{h.complaint_count}</span>
  </div>
))}
            </div>
          )}
        </section>

        {/* All Complaints */}
        <section className="card card-table">
          <h2 className="card-title">{t("all_complaints_title")}</h2>
          {grievances.length === 0 ? (
            <p className="empty-state">{t("all_complaints_empty")}</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>{t("table_complaint")}</th>
                  <th>{t("table_category")}</th>
                  <th>{t("table_status")}</th>
                </tr>
              </thead>
              <tbody>
                {grievances.map((g) => (
                  <tr key={g.id}>
                    <td className="complaint-text">{g.text}</td>
                    <td>
                      <span className="tag">{g.category}</span>
                    </td>
                    <td>
                      <span className={`status status-${g.status?.toLowerCase()}`}>{g.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Category Chart */}
        <section className="card card-chart">
          <h2 className="card-title">{t("chart_title")}</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={categoryStats} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D6" vertical={false} />
              <XAxis
                dataKey="category"
                angle={-30}
                textAnchor="end"
                interval={0}
                height={70}
                tick={{ fill: "#4A5468", fontSize: 12, fontFamily: "Inter, sans-serif" }}
              />
              <YAxis allowDecimals={false} tick={{ fill: "#4A5468", fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #E4E0D6", fontFamily: "Inter, sans-serif" }}
              />
              <Bar dataKey="count" fill="#16233F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
        {/* AI Chatbot */}
<section className="card card-chat">
  <h2 className="card-title">Ask ResolveIQ</h2>
  <p className="card-sub">Ask about complaint trends, hotspots, or status — answered from live data.</p>
  <form onSubmit={handleChatSubmit}>
    <textarea
      value={chatQuestion}
      onChange={(e) => setChatQuestion(e.target.value)}
      placeholder="e.g. Which area has the most complaints right now?"
      rows={2}
    />
    <button type="submit" disabled={chatLoading}>
      {chatLoading ? "Thinking…" : "Ask"}
    </button>
  </form>
  {chatAnswer && (
    <div className="result-banner result-ok">
      <span>{chatAnswer}</span>
    </div>
  )}
</section>
      </main>
    </div>
  );
}

export default App;