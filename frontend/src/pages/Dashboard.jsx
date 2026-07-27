import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { FileText, Clock, Flame, Activity, CheckCircle, AlertTriangle } from "lucide-react";
import { API_URL } from "../api";
import { useLanguage } from "../LanguageContext";

export default function Dashboard() {
  const { t } = useLanguage();
  const [grievances, setGrievances] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [districtStats, setDistrictStats] = useState([]);
  const [flaggedOfficers, setFlaggedOfficers] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all"); // all | pending | resolved | flagged | hotspots
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAllData = async () => {
    try {
      const [grievancesRes, statsRes, hotspotsRes, districtRes, corruptionRes] = await Promise.all([
        axios.get(`${API_URL}/get-grievances`),
        axios.get(`${API_URL}/category-stats`),
        axios.get(`${API_URL}/smart-hotspots`),
        axios.get(`${API_URL}/api/dashboard/districts`),
        axios.get(`${API_URL}/api/alerts/corruption`),
      ]);
      setGrievances(grievancesRes.data);
      setCategoryStats(statsRes.data);
      setHotspots(hotspotsRes.data);
      setDistrictStats(districtRes.data);
      // officer_name of every officer who has at least one fraud alert
      setFlaggedOfficers(corruptionRes.data.alerts.map((a) => a.officer_name));
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const markResolved = async (grievanceId) => {
    setUpdatingId(grievanceId);
    try {
      await axios.post(`${API_URL}/update-status`, null, {
        params: { grievance_id: grievanceId, new_status: "Resolved" },
      });
      await fetchAllData();
    } catch (err) {
      console.error("Error updating status:", err);
    }
    setUpdatingId(null);
  };

  const totalComplaints = grievances.length;
  const pendingCount = grievances.filter((g) => g.status === "Pending").length;
  const resolvedCount = grievances.filter((g) => g.status === "Resolved").length;
  const flaggedCount = grievances.filter((g) => flaggedOfficers.includes(g.assigned_officer)).length;
  const hotspotComplaintsCount = grievances.filter((g) => g.is_systemic).length;

  const getFilteredGrievances = () => {
    switch (activeFilter) {
      case "pending":
        return grievances.filter((g) => g.status === "Pending");
      case "resolved":
        return grievances.filter((g) => g.status === "Resolved");
      case "flagged":
        return grievances.filter((g) => flaggedOfficers.includes(g.assigned_officer));
      case "hotspots":
        return grievances.filter((g) => g.is_systemic);
      default:
        return grievances;
    }
  };

  const filteredGrievances = getFilteredGrievances();

  const filterLabels = {
    all: t.allComplaints,
    pending: t.pendingReview,
    resolved: t.resolvedLabel || "Resolved",
    flagged: t.flaggedLabel || "Flagged",
    hotspots: t.hotspotsFlagged,
  };

  return (
    <main className="shell">
      <section className="stats-strip">
        <button className={`stat stat-clickable ${activeFilter === "all" ? "stat-active" : ""}`} onClick={() => setActiveFilter("all")}>
          <span className="stat-icon"><FileText /></span>
          <span className="stat-body">
            <span className="stat-value">{totalComplaints}</span>
            <span className="stat-label">{t.totalComplaints}</span>
          </span>
        </button>

        <button className={`stat stat-clickable ${activeFilter === "pending" ? "stat-active" : ""}`} onClick={() => setActiveFilter("pending")}>
          <span className="stat-icon stat-icon-warn"><Clock /></span>
          <span className="stat-body">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">{t.pendingReview}</span>
          </span>
        </button>

        <button className={`stat stat-clickable ${activeFilter === "resolved" ? "stat-active" : ""}`} onClick={() => setActiveFilter("resolved")}>
          <span className="stat-icon stat-icon-ok"><CheckCircle /></span>
          <span className="stat-body">
            <span className="stat-value">{resolvedCount}</span>
            <span className="stat-label">{t.resolvedLabel || "Resolved"}</span>
          </span>
        </button>

        <button className={`stat stat-clickable ${activeFilter === "flagged" ? "stat-active" : ""}`} onClick={() => setActiveFilter("flagged")}>
          <span className="stat-icon stat-icon-alert"><AlertTriangle /></span>
          <span className="stat-body">
            <span className="stat-value">{flaggedCount}</span>
            <span className="stat-label">{t.flaggedLabel || "Flagged"}</span>
          </span>
        </button>

        <button className={`stat stat-clickable ${activeFilter === "hotspots" ? "stat-active" : ""}`} onClick={() => setActiveFilter("hotspots")}>
          <span className="stat-icon stat-icon-alert"><Flame /></span>
          <span className="stat-body">
            <span className="stat-value">{hotspotComplaintsCount}</span>
            <span className="stat-label">{t.hotspotsFlagged}</span>
          </span>
        </button>
      </section>

      <section className="card card-hotspots">
        <h2 className="card-title">
          <Activity />
          {t.hotspotsTitle}
        </h2>
        {hotspots.length === 0 ? (
          <p className="empty-state">{t.noHotspots}</p>
        ) : (
          <div className="hotspot-list">
            {hotspots.map((h, i) => (
              <div className="hotspot-row" key={i}>
                <span className="hotspot-category">{h.category} — {h.location}</span>
                <div className="hotspot-bar-track">
                  <div className="hotspot-bar-fill" style={{ width: `${Math.min(h.complaint_count * 20, 100)}%` }} />
                </div>
                <span className="hotspot-count">{h.complaint_count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card card-table">
        <h2 className="card-title">{filterLabels[activeFilter]}</h2>
        {filteredGrievances.length === 0 ? (
          <p className="empty-state">{t.noComplaints}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t.complaint}</th>
                <th>{t.category}</th>
                <th>{t.district}</th>
                <th>{t.priority}</th>
                <th>{t.status}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredGrievances.map((g) => (
                <tr key={g.id}>
                  <td className="complaint-text">{g.text}</td>
                  <td><span className="tag">{g.category}</span></td>
                  <td>{g.district || "—"}</td>
                  <td>
                    <span className={`priority-pill priority-${g.priority_score >= 4 ? "high" : g.priority_score === 3 ? "mid" : "low"}`}>
                      {g.priority_score ?? "—"}
                    </span>
                  </td>
                  <td><span className={`status status-${g.status?.toLowerCase()}`}>{g.status}</span></td>
                  <td>
                    {g.status !== "Resolved" && (
                      <button className="resolve-btn" onClick={() => markResolved(g.id)} disabled={updatingId === g.id}>
                        {updatingId === g.id ? "…" : "Mark Resolved"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card card-district">
        <h2 className="card-title">{t.byDistrict}</h2>
        {districtStats.length === 0 ? (
          <p className="empty-state">{t.noComplaints}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t.district}</th>
                <th>{t.complaint}</th>
                <th>{t.avgPriority}</th>
              </tr>
            </thead>
            <tbody>
              {districtStats.map((d, i) => (
                <tr key={i}>
                  <td>{d.district}</td>
                  <td>{d.complaint_count}</td>
                  <td>{d.avg_priority ? Number(d.avg_priority).toFixed(1) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card card-chart">
        <h2 className="card-title">{t.byCategory}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={categoryStats} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4E0D6" vertical={false} />
            <XAxis dataKey="category" angle={-30} textAnchor="end" interval={0} height={70} tick={{ fill: "#4A5468", fontSize: 12, fontFamily: "Inter, sans-serif" }} />
            <YAxis allowDecimals={false} tick={{ fill: "#4A5468", fontSize: 12 }} />
            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E4E0D6", fontFamily: "Inter, sans-serif" }} />
            <Bar dataKey="count" fill="#16233F" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </section>
    </main>
  );
}