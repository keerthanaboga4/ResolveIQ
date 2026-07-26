import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileEdit, ShieldAlert, MessageCircle, Info } from "lucide-react";
import { LANGUAGES } from "../translations";
import { useLanguage } from "../LanguageContext";

export default function Navbar() {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <span className="brand-mark" />
          <span className="brand-name">ResolveIQ</span>
        </div>
        <span className="brand-tagline">{t.tagline}</span>

        <nav className="main-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
            <LayoutDashboard /> {t.navDashboard}
          </NavLink>
          <NavLink to="/submit" className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
            <FileEdit /> {t.navSubmit}
          </NavLink>
          <NavLink to="/alerts" className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
            <ShieldAlert /> {t.navAlerts}
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
            <MessageCircle /> {t.navChat}
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}>
             <Info /> {t.navAbout}
            </NavLink>
        </nav>

        <div className="lang-switcher">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              className={`lang-btn ${lang === l.code ? "lang-btn-active" : ""}`}
              onClick={() => setLang(l.code)}
              type="button"
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pulse-strip">
        <svg viewBox="0 0 400 22" preserveAspectRatio="none">
          <path d="M0,11 L60,11 L70,3 L80,19 L90,11 L140,11 L150,5 L160,17 L170,11 L400,11" />
        </svg>
      </div>
    </header>
  );
}