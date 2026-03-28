import { useState } from "react";

import BrowserContact from "../components/browser/BrowserContact";
import BrowserTechStack from "../components/browser/BrowserTechStack";
import { browserSections } from "../data/browserSections";

function BrowserApp() {
  const [activeSectionId, setActiveSectionId] = useState(browserSections[0].id);

  const activeSection =
    browserSections.find((section) => section.id === activeSectionId) ?? browserSections[0];

  return (
    <div className="browser-app">
      <div className="browser-toolbar">
        <div className="browser-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="browser-address">https://suuronen.dev/{activeSection.id}</div>
      </div>

      <div className="browser-layout">
        <nav className="browser-nav" aria-label="Browser sections">
          {browserSections.map((section) => (
            <button
              key={section.id}
              className={`browser-nav-button${section.id === activeSection.id ? " is-active" : ""}`}
              type="button"
              onClick={() => setActiveSectionId(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <section className="browser-panel">
          <p className="browser-eyebrow">{activeSection.eyebrow}</p>
          <h2>{activeSection.heading}</h2>
          <p className="browser-description">{activeSection.description}</p>
          {activeSection.note ? <div className="browser-note-banner">{activeSection.note}</div> : null}
          {activeSection.highlights?.length ? (
            <div className="browser-highlight-row" aria-label="Section highlights">
              {activeSection.highlights.map((highlight) => (
                <span key={highlight} className="browser-highlight-chip">
                  {highlight}
                </span>
              ))}
            </div>
          ) : null}

          {activeSection.view === "tech-stack" ? (
            <BrowserTechStack />
          ) : activeSection.view === "contact" ? (
            <BrowserContact />
          ) : (
            <div className="browser-card-grid">
              {activeSection.cards.map((card) => {
                const CardTag = card.href ? "a" : "article";

                return (
                  <CardTag
                    key={card.title}
                    className="browser-card"
                    {...(card.href
                      ? {
                          href: card.href,
                          target: "_blank",
                          rel: "noreferrer",
                        }
                      : {})}
                  >
                    <span className="browser-card-label">{card.label}</span>
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </CardTag>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default BrowserApp;
