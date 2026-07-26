import React from "react";
import { Info, Cpu, ShieldCheck, Languages, MessageSquare } from "lucide-react";
import { useLanguage } from "../LanguageContext";

export default function About() {
  const { t } = useLanguage();

  return (
    <main className="shell">
      <section className="card card-about">
        <h2 className="card-title">
          <Info />
          {t.aboutTitle}
        </h2>
        <p className="card-sub">{t.aboutIntro}</p>

        <div className="about-feature-list">
          <div className="about-feature">
            <Cpu />
            <div>
              <h3>{t.aboutFeature1Title}</h3>
              <p>{t.aboutFeature1Text}</p>
            </div>
          </div>
          <div className="about-feature">
            <Languages />
            <div>
              <h3>{t.aboutFeature2Title}</h3>
              <p>{t.aboutFeature2Text}</p>
            </div>
          </div>
          <div className="about-feature">
            <ShieldCheck />
            <div>
              <h3>{t.aboutFeature3Title}</h3>
              <p>{t.aboutFeature3Text}</p>
            </div>
          </div>
          <div className="about-feature">
            <MessageSquare />
            <div>
              <h3>{t.aboutFeature4Title}</h3>
              <p>{t.aboutFeature4Text}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
