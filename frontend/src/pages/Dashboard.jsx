import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { FileText, Clock, LayoutList, Flame, Activity } from "lucide-react";
import { API_URL } from "../api";
import { useLanguage } from "../LanguageContext";

export default function Dashboard() {
  const { t } = useLanguage();
  const [grievances, setGrievances] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [districtStats, setDistrictStats] = useState([]);

  const fetchAllData = async () => {
    try {
      const [grievancesRes, statsRes, hotspotsRes, districtRes] = await Promise.all([
        axios.get(`${API_URL}/get-grievances`),
        axios.get(`${API_URL}/category-stats`),
        axios.get(`${API_URL}/smart-hotspots`),
        axios.get(`${API_URL}/api/dashboard/districts`),
      ]);
      setGrievances(grievancesRes.data);
      setCategoryStats(statsRes.data);
      setHotspots(hotspotsRes.data);
      setDistrictStats(districtRes.data);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const totalComplaints = grievances.length;
  const pendingCount = grievances.filter((g) => g.status === "Pending").length;

  return (
    <main className="shell">
      <section className="stats-strip">
        <div className="stat">
          <span className="stat-icon"><FileText /></span>
          <span className="stat-body">
            <span className="stat-value">{totalComplaints}</span>
            <span className="stat-label">{t.totalComplaints}</span>
          </span>
        </div>
        <div className="stat">
          <span className="stat-icon stat-icon-warn"><Clock /></span>
          <span className="stat-body">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">{t.pendingReview}</span>
          </span>
        </div>
        <div className="stat">
          <span className="stat-icon"><LayoutList /></span>
          <span className="stat-body">
            <span className="stat-value">{categoryStats.length}</span>
            <span className="stat-label">{t.activeCategories}</span>
          </span>
        </div>
        <div className="stat">
          <span className="stat-icon stat-icon-alert"><Flame /></span>
          <span className="stat-body">
            <span className="stat-value">{hotspots.length}</span>
            <span className="stat-label">{t.hotspotsFlagged}</span>
          </span>
        </div>
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

      <section className="card card-table">
        <h2 className="card-title">{t.allComplaints}</h2>
        {grievances.length === 0 ? (
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
              </tr>
            </thead>
            <tbody>
              {grievances.map((g) => (
                <tr key={g.id}>
                  <td className="complaint-text">{g.text}</td>
                  <td>
                    <span className="tag">{g.category}</span>
                  </td>
                  <td>{g.district || "—"}</td>
                  <td>
                    <span className={`priority-pill priority-${g.priority_score >= 4 ? "high" : g.priority_score === 3 ? "mid" : "low"}`}>
                      {g.priority_score ?? "—"}
                    </span>
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
  );
}