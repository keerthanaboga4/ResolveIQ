import React, { useState, useEffect } from "react";
import axios from "axios";
import { ShieldAlert, AlertTriangle, Network } from "lucide-react";
import { API_URL } from "../api";
import { useLanguage } from "../LanguageContext";
import RadialRing from "../components/RadialRing";

export default function AlertsPage() {
  const { t } = useLanguage();
  const [officers, setOfficers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [systemicIssues, setSystemicIssues] = useState([]);

  const fetchData = async () => {
    try {
      const [corruptionRes, systemicRes] = await Promise.all([
        axios.get(`${API_URL}/api/alerts/corruption`),
        axios.get(`${API_URL}/api/alerts/systemic`),
      ]);
      setOfficers(corruptionRes.data.officers || []);
      setAlerts(corruptionRes.data.alerts || []);
      setSystemicIssues(systemicRes.data || []);
    } catch (err) {
      console.error("Error fetching alerts data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const ringColor = (score) => (score > 30 ? "#A8341F" : score > 10 ? "#E8A33D" : "#1F7A45");

  return (
    <main className="shell">
      {/* Officer Corruption Risk */}
      <section className="card card-alerts">
        <h2 className="card-title">
          <ShieldAlert />
          {t.corruptionRisk}
        </h2>
        {officers.length === 0 ? (
          <p className="empty-state">{t.noOfficers}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t.officer}</th>
                <th>{t.department}</th>
                <th>{t.riskScore}</th>
                <th>{t.grade}</th>
              </tr>
            </thead>
            <tbody>
              {officers.map((o, i) => (
                <tr key={i}>
                  <td>{o.officer_name}</td>
                  <td>{o.department}</td>
                  <td>
                    <RadialRing value={o.corruption_risk_score} color={ringColor(o.corruption_risk_score)} />
                  </td>
                  <td>
                    <span className={`grade grade-${o.performance_grade?.toLowerCase()}`}>
                      {o.performance_grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Fraud Alerts */}
      <section className="card card-alerts">
        <h2 className="card-title">
          <AlertTriangle />
          {t.fraudAlerts}
        </h2>
        {alerts.length === 0 ? (
          <p className="empty-state">{t.noAlerts}</p>
        ) : (
          <div className="alert-list">
            {alerts.map((a, i) => (
              <div className={`alert-card severity-${a.severity?.toLowerCase()}`} key={i}>
                <span className="alert-icon"><AlertTriangle /></span>
                <div className="alert-body">
                  <div className="alert-header">
                    <span className="alert-officer">{a.officer_name}</span>
                    <span className={`severity-tag severity-${a.severity?.toLowerCase()}`}>{a.severity}</span>
                  </div>
                  <p className="alert-description">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Systemic Issues */}
      <section className="card card-alerts">
        <h2 className="card-title">
          <Network />
          {t.systemicIssues}
        </h2>
        {systemicIssues.length === 0 ? (
          <p className="empty-state">{t.noSystemic}</p>
        ) : (
          <div className="hotspot-list">
            {systemicIssues.map((s, i) => (
              <div className="hotspot-row" key={i}>
                <span className="hotspot-category">
                  {s.category} — {s.location} {s.district ? `(${s.district})` : ""}
                </span>
                <div className="hotspot-bar-track">
                  <div
                    className="hotspot-bar-fill"
                    style={{ width: `${Math.min(s.complaint_count * 20, 100)}%` }}
                  />
                </div>
                <span className="hotspot-count">{s.complaint_count}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}