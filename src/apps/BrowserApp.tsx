import { useEffect, useMemo, useState } from "react";
import { House } from "lucide-react";

import BrowserContact from "../components/browser/BrowserContact";
import BrowserLoading from "../components/browser/BrowserLoading";
import BrowserTechStack from "../components/browser/BrowserTechStack";
import BrowserUnavailable from "../components/browser/BrowserUnavailable";
import { browserSections } from "../data/browserSections";
import { useLocale } from "../i18n/locale";

const EMBED_TIMEOUT_MS = 2800;

type BrowserPageState =
  | {
      kind: "internal";
      sectionId: string;
    }
  | {
      kind: "external";
      status: "loading" | "ready" | "unavailable";
      url: string;
    };

function normalizeAddressInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const normalizedSectionId = trimmed
    .replace(/^https?:\/\/suuronen\.dev\//i, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  if (browserSections.some((section) => section.id === normalizedSectionId)) {
    return { kind: "internal" as const, sectionId: normalizedSectionId };
  }

  if (/^[a-z]+:\/\//i.test(trimmed)) {
    return { kind: "external" as const, url: trimmed };
  }

  return { kind: "external" as const, url: `https://${trimmed}` };
}

function BrowserApp() {
  const { t } = useLocale();
  const defaultSectionId = browserSections[0].id;
  const [pageState, setPageState] = useState<BrowserPageState>({
    kind: "internal",
    sectionId: defaultSectionId,
  });
  const [addressInput, setAddressInput] = useState(`https://suuronen.dev/${defaultSectionId}`);

  const activeSectionId = pageState.kind === "internal" ? pageState.sectionId : null;
  const activeSection = useMemo(
    () =>
      browserSections.find((section) => section.id === activeSectionId) ??
      browserSections.find((section) => section.id === defaultSectionId) ??
      browserSections[0],
    [activeSectionId, defaultSectionId],
  );
  const isExternalPage = pageState.kind === "external";

  useEffect(() => {
    if (pageState.kind !== "external" || pageState.status !== "loading") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPageState((current) =>
        current.kind === "external" && current.url === pageState.url && current.status === "loading"
          ? { ...current, status: "unavailable" }
          : current,
      );
    }, EMBED_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [pageState]);

  const openInternalSection = (sectionId: string) => {
    setPageState({ kind: "internal", sectionId });
    setAddressInput(`https://suuronen.dev/${sectionId}`);
  };

  const handleAddressSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextTarget = normalizeAddressInput(addressInput);

    if (!nextTarget) {
      setAddressInput(
        pageState.kind === "internal" ? `https://suuronen.dev/${activeSection.id}` : pageState.url,
      );
      return;
    }

    if (nextTarget.kind === "internal") {
      openInternalSection(nextTarget.sectionId);
      return;
    }

    setPageState({
      kind: "external",
      status: "loading",
      url: nextTarget.url,
    });
    setAddressInput(nextTarget.url);
  };

  return (
    <div className="browser-app">
      <div className="browser-toolbar">
        <div className="browser-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <button
          className="browser-home-button"
          type="button"
          aria-label={t("Open browser home")}
          onClick={() => openInternalSection(defaultSectionId)}
        >
          <House className="browser-home-icon" />
        </button>
        <form className="browser-address-form" onSubmit={handleAddressSubmit}>
          <input
            className="browser-address-input"
            aria-label={t("Browser address")}
            type="text"
            value={addressInput}
            onChange={(event) => setAddressInput(event.target.value)}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
          />
        </form>
      </div>

      <div className={`browser-layout${isExternalPage ? " is-external" : ""}`}>
        {!isExternalPage ? (
          <nav className="browser-nav" aria-label={t("Browser sections")}>
            {browserSections.map((section) => (
              <button
                key={section.id}
                className={`browser-nav-button${section.id === activeSectionId ? " is-active" : ""}`}
                type="button"
                onClick={() => openInternalSection(section.id)}
              >
                {t(section.label)}
              </button>
            ))}
          </nav>
        ) : null}

        <section className={`browser-panel${isExternalPage ? " is-external" : ""}`}>
          {pageState.kind === "external" ? (
            pageState.status === "ready" ? (
              <div className="browser-iframe-shell">
                <iframe
                  key={pageState.url}
                  className="browser-iframe"
                  title={pageState.url}
                  src={pageState.url}
                  loading="eager"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            ) : pageState.status === "loading" ? (
              <>
                <BrowserLoading attemptedUrl={pageState.url} />
                <iframe
                  key={pageState.url}
                  className="browser-iframe browser-iframe--hidden"
                  title={pageState.url}
                  src={pageState.url}
                  loading="eager"
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() =>
                    setPageState((current) =>
                      current.kind === "external" && current.url === pageState.url
                        ? { ...current, status: "ready" }
                        : current,
                    )
                  }
                />
              </>
            ) : (
              <BrowserUnavailable attemptedUrl={pageState.url} />
            )
          ) : (
            <>
              <p className="browser-eyebrow">{t(activeSection.eyebrow)}</p>
              <h2>{t(activeSection.heading)}</h2>
              <p className="browser-description">{t(activeSection.description)}</p>
              {activeSection.note ? <div className="browser-note-banner">{t(activeSection.note)}</div> : null}
              {activeSection.highlights?.length ? (
                <div className="browser-highlight-row" aria-label={t("Section highlights")}>
                  {activeSection.highlights.map((highlight) => (
                    <span key={highlight} className="browser-highlight-chip">
                      {t(highlight)}
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
                        <span className="browser-card-label">{t(card.label)}</span>
                        <h3>{t(card.title)}</h3>
                        <p>{t(card.description)}</p>
                      </CardTag>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default BrowserApp;
