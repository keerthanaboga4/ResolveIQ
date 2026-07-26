import React, { useState } from "react";
import axios from "axios";
import { Sparkles } from "lucide-react";
import { API_URL } from "../api";
import { useLanguage } from "../LanguageContext";

export default function SubmitComplaint() {
  const { lang, t } = useLanguage();
  const [complaintText, setComplaintText] = useState("");
  const [citizenName, setCitizenName] = useState("");
  const [phone, setPhone] = useState("");
  const [district, setDistrict] = useState("");
  const [state, setState] = useState("");
  const [submitResult, setSubmitResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        text: complaintText,
        citizen_name: citizenName,
        phone: phone,
        district: district,
        state: state,
        language: lang,
      });
      const res = await axios.post(`${API_URL}/submit-grievance?${params.toString()}`);
      setSubmitResult(res.data);
      setComplaintText("");
    } catch (err) {
      console.error("Error submitting grievance:", err);
      setSubmitResult({ error: t.error });
    }
    setLoading(false);
  };

  return (
    <main className="shell">
      <div className="submit-grid">
        <section className="card card-submit">
          <h2 className="card-title">{t.fileComplaint}</h2>
          <p className="card-sub">{t.fileComplaintSub}</p>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <input
                type="text"
                value={citizenName}
                onChange={(e) => setCitizenName(e.target.value)}
                placeholder={t.namePlaceholder}
              />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t.phonePlaceholder}
              />
            </div>
            <div className="form-row">
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder={t.districtPlaceholder}
              />
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder={t.statePlaceholder}
              />
            </div>
            <textarea
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder={t.placeholder}
              rows={5}
            />
            <button type="submit" disabled={loading}>
              <Sparkles size={15} />
              {loading ? t.classifying : t.submit}
            </button>
          </form>

          {submitResult && (
            <div className={`result-banner ${submitResult.error ? "result-error" : "result-ok"}`}>
              {submitResult.error ? (
                <span>{submitResult.error}</span>
              ) : (
                <div className="result-details">
                  <div>
                    <span className="result-label">{t.classifiedAs}</span>
                    <span className="result-category">{submitResult.category}</span>
                  </div>
                  <div>
                    <span className="result-label">{t.assignedTo}</span>
                    <span className="result-category">{submitResult.assigned_officer}</span>
                  </div>
                  <div>
                    <span className="result-label">{t.priority}</span>
                    <span className="result-category">{submitResult.priority_score} / 5</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="info-panel">
          <h2 className="card-title">What happens next</h2>
          <div className="info-step">
            <span className="info-step-num">1</span>
            <span className="info-step-text">
              <b>AI reads your complaint</b> in English, Hindi, or Telugu — no forms to fill in a second language.
            </span>
          </div>
          <div className="info-step">
            <span className="info-step-num">2</span>
            <span className="info-step-text">
              <b>Auto-classified and routed</b> to the right department and duty officer instantly.
            </span>
          </div>
          <div className="info-step">
            <span className="info-step-num">3</span>
            <span className="info-step-text">
              <b>Checked against past reports</b> — if others reported the same issue nearby, it's flagged as systemic.
            </span>
          </div>
          <div className="info-step">
            <span className="info-step-num">4</span>
            <span className="info-step-text">
              <b>Priority-scored</b> so urgent safety issues surface before minor ones.
            </span>
          </div>
        </aside>
      </div>
    </main>
  );
}