import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import "./App.css";

const API_URL = "https://resolveiq-backend-312937988421.us-central1.run.app";

function App() {
  const [complaintText, setComplaintText] = useState("");
  const [submitResult, setSubmitResult] = useState(null);
  const [grievances, setGrievances] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllData = async () => {
    try {
      const [grievancesRes, statsRes, hotspotsRes] = await Promise.all([
        axios.get(`${API_URL}/get-grievances`),
        axios.get(`${API_URL}/category-stats`),
        axios.get(`${API_URL}/hotspots`),
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
        `${API_URL}/submit-grievance?text=${encodeURIComponent(complaintText)}`
      );
      setSubmitResult(res.data);
      setComplaintText("");
      fetchAllData();
    } catch (err) {
      console.error("Error submitting grievance:", err);
      setSubmitResult({ error: "Something went wrong. Try again." });
    }
    setLoading(false);
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
            <span className="brand-name">ResolveIQ</span>
          </div>
          <span className="brand-tagline">Civic Grievance Intelligence</span>
        </div>
      </header>

      <main className="shell">
        {/* Hero / Stats strip */}
        <section className="stats-strip">
          <div className="stat">
            <span className="stat-value">{totalComplaints}</span>
            <span className="stat-label">Total complaints</span>
          </div>
          <div className="stat">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">Pending review</span>
          </div>
          <div className="stat">
            <span className="stat-value">{categoryStats.length}</span>
            <span className="stat-label">Active categories</span>
          </div>
          <div className="stat">
            <span className="stat-value">{hotspots.length}</span>
            <span className="stat-label">Hotspots flagged</span>
          </div>
        </section>

        {/* Submit Form */}
        <section className="card card-submit">
          <h2 className="card-title">File a complaint</h2>
          <p className="card-sub">Describe the issue in your own words — it's classified automatically.</p>
          <form onSubmit={handleSubmit}>
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="e.g. The streetlight outside block 4 has been out for two weeks..."
              rows={5}
            />
            <button type="submit" disabled={loading}>
              {loading ? "Classifying…" : "Submit complaint"}
            </button>
          </form>

          {submitResult && (
            <div className={`result-banner ${submitResult.error ? "result-error" : "result-ok"}`}>
              {submitResult.error ? (
                <span>{submitResult.error}</span>
              ) : (
                <>
                  <span className="result-label">Classified as</span>
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
            Hotspots — repeated complaint categories
          </h2>
          {hotspots.length === 0 ? (
            <p className="empty-state">No hotspots yet — patterns emerge once complaints start repeating.</p>
          ) : (
            <div className="hotspot-list">
              {hotspots.map((h, i) => (
                <div className="hotspot-row" key={i}>
                  <span className="hotspot-category">{h.category}</span>
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
          <h2 className="card-title">All submitted complaints</h2>
          {grievances.length === 0 ? (
            <p className="empty-state">Nothing submitted yet — the first complaint will appear here.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Complaint</th>
                  <th>Category</th>
                  <th>Status</th>
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
          <h2 className="card-title">Complaints by category</h2>
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
      </main>
    </div>
  );
}

export default App;