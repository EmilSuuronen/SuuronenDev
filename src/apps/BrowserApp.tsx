import { useEffect, useMemo, useState } from "react";
import { Globe2, House, Plus, X } from "lucide-react";

import BrowserContact from "../components/browser/BrowserContact";
import BrowserLoading from "../components/browser/BrowserLoading";
import BrowserTechStack from "../components/browser/BrowserTechStack";
import BrowserUnavailable from "../components/browser/BrowserUnavailable";
import { browserSections } from "../data/browserSections";
import { useLocale } from "../i18n/locale";

const EMBED_TIMEOUT_MS = 2800;
const MAX_BROWSER_TABS = 12;

let tabSequence = 0;

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

type BrowserTab = {
  id: string;
  pageState: BrowserPageState;
};

function createTabId() {
  tabSequence += 1;
  return `browser-tab-${tabSequence}`;
}

function getInternalUrl(sectionId: string) {
  return `https://suuronen.dev/${sectionId}`;
}

function createInternalTab(sectionId: string): BrowserTab {
  return {
    id: createTabId(),
    pageState: {
      kind: "internal",
      sectionId,
    },
  };
}

function getExternalTabTitle(url: string) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.replace(/^www\./i, "") || url;
  } catch {
    return url;
  }
}

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
  const [tabs, setTabs] = useState<BrowserTab[]>(() => [createInternalTab(defaultSectionId)]);
  const [activeTabId, setActiveTabId] = useState(() => tabs[0]?.id ?? createTabId());
  const [addressInput, setAddressInput] = useState(getInternalUrl(defaultSectionId));

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [activeTabId, tabs],
  );
  const pageState = activeTab?.pageState ?? { kind: "internal", sectionId: defaultSectionId };
  const activeSectionId = pageState.kind === "internal" ? pageState.sectionId : null;
  const activeSection = useMemo(
    () =>
      browserSections.find((section) => section.id === activeSectionId) ??
      browserSections.find((section) => section.id === defaultSectionId) ??
      browserSections[0],
    [activeSectionId, defaultSectionId],
  );
  const isExternalPage = pageState.kind === "external";
  const canCloseTabs = tabs.length > 1;
  const canOpenTabs = tabs.length < MAX_BROWSER_TABS;

  useEffect(() => {
    if (pageState.kind === "internal") {
      setAddressInput(getInternalUrl(pageState.sectionId));
      return;
    }

    setAddressInput(pageState.url);
  }, [pageState]);

  useEffect(() => {
    if (!activeTab || pageState.kind !== "external" || pageState.status !== "loading") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setTabs((currentTabs) =>
        currentTabs.map((tab) =>
          tab.id === activeTab.id &&
          tab.pageState.kind === "external" &&
          tab.pageState.url === pageState.url &&
          tab.pageState.status === "loading"
            ? {
                ...tab,
                pageState: {
                  ...tab.pageState,
                  status: "unavailable",
                },
              }
            : tab,
        ),
      );
    }, EMBED_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab, pageState]);

  const updateTabPageState = (tabId: string, nextPageState: BrowserPageState) => {
    setTabs((currentTabs) =>
      currentTabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              pageState: nextPageState,
            }
          : tab,
      ),
    );
  };

  const openInternalSection = (sectionId: string, targetTabId = activeTab.id) => {
    updateTabPageState(targetTabId, { kind: "internal", sectionId });
    setActiveTabId(targetTabId);
  };

  const openNewTab = () => {
    if (!canOpenTabs) {
      return;
    }

    const nextTab = createInternalTab(defaultSectionId);
    setTabs((currentTabs) => [...currentTabs, nextTab]);
    setActiveTabId(nextTab.id);
  };

  const closeTab = (tabId: string) => {
    setTabs((currentTabs) => {
      const tabIndex = currentTabs.findIndex((tab) => tab.id === tabId);

      if (tabIndex === -1) {
        return currentTabs;
      }

      if (currentTabs.length === 1) {
        const replacementTab = createInternalTab(defaultSectionId);
        setActiveTabId(replacementTab.id);
        return [replacementTab];
      }

      const nextTabs = currentTabs.filter((tab) => tab.id !== tabId);

      if (activeTabId === tabId) {
        setActiveTabId(nextTabs[Math.max(0, tabIndex - 1)]?.id ?? nextTabs[0].id);
      }

      return nextTabs;
    });
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

    updateTabPageState(activeTab.id, {
      kind: "external",
      status: "loading",
      url: nextTarget.url,
    });
  };

  const getTabTitle = (tab: BrowserTab) => {
    if (tab.pageState.kind === "internal") {
      const { sectionId } = tab.pageState;

      return t(
        browserSections.find((section) => section.id === sectionId)?.label ??
          browserSections[0].label,
      );
    }

    return getExternalTabTitle(tab.pageState.url);
  };

  return (
    <div className={`browser-app${isExternalPage ? " is-external" : ""}`}>
      <div className="browser-chrome">
        <div className="browser-tabs-shell">
          <div className="browser-tabs" role="tablist" aria-label={t("Browser tabs")}>
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab.id;

              return (
                <button
                  key={tab.id}
                  className={`browser-tab${isActive ? " is-active" : ""}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span className="browser-tab-icon" aria-hidden="true">
                    {tab.pageState.kind === "internal" ? (
                      <House className="browser-tab-icon-glyph" />
                    ) : (
                      <Globe2 className="browser-tab-icon-glyph" />
                    )}
                  </span>
                  <span className="browser-tab-label">{getTabTitle(tab)}</span>
                  <span
                    className={`browser-tab-close-shell${canCloseTabs ? "" : " is-disabled"}`}
                    aria-hidden="true"
                  >
                    <span
                      className="browser-tab-close"
                      onClick={(event) => {
                        if (!canCloseTabs) {
                          return;
                        }
                        event.stopPropagation();
                        closeTab(tab.id);
                      }}
                    >
                      <X className="browser-tab-close-icon" />
                    </span>
                  </span>
                </button>
              );
            })}

            <button
              className="browser-tab-new"
              type="button"
              aria-label={t("New tab")}
              disabled={!canOpenTabs}
              onClick={openNewTab}
            >
              <Plus className="browser-tab-new-icon" />
            </button>
          </div>
        </div>

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
                    setTabs((currentTabs) =>
                      currentTabs.map((tab) =>
                        tab.id === activeTab.id &&
                        tab.pageState.kind === "external" &&
                        tab.pageState.url === pageState.url
                          ? {
                              ...tab,
                              pageState: {
                                ...tab.pageState,
                                status: "ready",
                              },
                            }
                          : tab,
                      ),
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
