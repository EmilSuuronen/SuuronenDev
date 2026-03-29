import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  Globe2,
  House,
  Mail,
  Plus,
  RefreshCw,
  UserRound,
  X,
} from "lucide-react";
import { FaGithub, FaLinkedinIn } from "react-icons/fa6";

import BrowserContact from "../components/browser/BrowserContact";
import BrowserLoading from "../components/browser/BrowserLoading";
import BrowserPixelCat from "../components/browser/BrowserPixelCat";
import BrowserTechStack from "../components/browser/BrowserTechStack";
import BrowserUnavailable from "../components/browser/BrowserUnavailable";
import { browserSections } from "../data/browserSections";
import { contactLinks } from "../data/contactLinks";
import { useLocale } from "../i18n/locale";

const EMBED_TIMEOUT_MS = 8000;
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
  history: BrowserPageState[];
  historyIndex: number;
  id: string;
  refreshToken: number;
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
    history: [
      {
        kind: "internal",
        sectionId,
      },
    ],
    historyIndex: 0,
    id: createTabId(),
    refreshToken: 0,
  };
}

function getCurrentPageState(tab: BrowserTab): BrowserPageState {
  return tab.history[tab.historyIndex] ?? tab.history[0];
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

function getSectionIcon(sectionId: string) {
  if (sectionId === "about") {
    return UserRound;
  }

  if (sectionId === "tech-stack") {
    return Cpu;
  }

  return Mail;
}

function getContactIcon(type: "email" | "github" | "linkedin") {
  if (type === "github") {
    return FaGithub;
  }

  if (type === "linkedin") {
    return FaLinkedinIn;
  }

  return Mail;
}

function BrowserApp() {
  const { t } = useLocale();
  const defaultSectionId = browserSections[0].id;
  const loadingIframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeLoadStateRef = useRef<{ tabId: string | null; url: string | null; loaded: boolean }>({
    tabId: null,
    url: null,
    loaded: false,
  });
  const [tabs, setTabs] = useState<BrowserTab[]>(() => [createInternalTab(defaultSectionId)]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [addressInput, setAddressInput] = useState(getInternalUrl(defaultSectionId));

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [activeTabId, tabs],
  );
  const pageState = activeTab ? getCurrentPageState(activeTab) : { kind: "internal" as const, sectionId: defaultSectionId };
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
  const canNavigateBack = Boolean(activeTab && activeTab.historyIndex > 0);
  const canNavigateForward = Boolean(activeTab && activeTab.historyIndex < activeTab.history.length - 1);

  useEffect(() => {
    if (!activeTabId && tabs[0]) {
      setActiveTabId(tabs[0].id);
    }
  }, [activeTabId, tabs]);

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

    iframeLoadStateRef.current = {
      tabId: activeTab.id,
      url: pageState.url,
      loaded: false,
    };

    const timeoutId = window.setTimeout(() => {
      const loadState = iframeLoadStateRef.current;

      if (
        loadState.loaded ||
        loadState.tabId !== activeTab.id ||
        loadState.url !== pageState.url
      ) {
        return;
      }

      setTabs((currentTabs) =>
        currentTabs.map((tab) => {
          if (tab.id !== activeTab.id) {
            return tab;
          }

          const currentPageState = getCurrentPageState(tab);

          if (
            currentPageState.kind !== "external" ||
            currentPageState.url !== pageState.url ||
            currentPageState.status !== "loading"
          ) {
            return tab;
          }

          const nextHistory = [...tab.history];
          nextHistory[tab.historyIndex] = {
            ...currentPageState,
            status: "unavailable",
          };

          return {
            ...tab,
            history: nextHistory,
          };
        }),
      );
    }, EMBED_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab, pageState]);

  const navigateTab = (tabId: string, nextPageState: BrowserPageState) => {
    setTabs((currentTabs) =>
      currentTabs.map((tab) => {
        if (tab.id !== tabId) {
          return tab;
        }

        const nextHistory = [...tab.history.slice(0, tab.historyIndex + 1), nextPageState];

        return {
          ...tab,
          history: nextHistory,
          historyIndex: nextHistory.length - 1,
        };
      }),
    );
  };

  const patchCurrentPageState = (
    tabId: string,
    updater: (pageState: BrowserPageState) => BrowserPageState,
  ) => {
    setTabs((currentTabs) =>
      currentTabs.map((tab) => {
        if (tab.id !== tabId) {
          return tab;
        }

        const nextHistory = [...tab.history];
        nextHistory[tab.historyIndex] = updater(nextHistory[tab.historyIndex]);

        return {
          ...tab,
          history: nextHistory,
        };
      }),
    );
  };

  const openInternalSection = (sectionId: string, targetTabId = activeTab?.id) => {
    if (!targetTabId) {
      return;
    }

    navigateTab(targetTabId, { kind: "internal", sectionId });
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

    if (!activeTab) {
      return;
    }

    const nextTarget = normalizeAddressInput(addressInput);

    if (!nextTarget) {
      setAddressInput(
        pageState.kind === "internal" ? getInternalUrl(activeSection.id) : pageState.url,
      );
      return;
    }

    if (nextTarget.kind === "internal") {
      openInternalSection(nextTarget.sectionId, activeTab.id);
      return;
    }

    navigateTab(activeTab.id, {
      kind: "external",
      status: "loading",
      url: nextTarget.url,
    });
  };

  const handleNavigateHistory = (direction: "back" | "forward") => {
    if (!activeTab) {
      return;
    }

    setTabs((currentTabs) =>
      currentTabs.map((tab) => {
        if (tab.id !== activeTab.id) {
          return tab;
        }

        const nextIndex =
          direction === "back"
            ? Math.max(0, tab.historyIndex - 1)
            : Math.min(tab.history.length - 1, tab.historyIndex + 1);

        return nextIndex === tab.historyIndex
          ? tab
          : {
              ...tab,
              historyIndex: nextIndex,
            };
      }),
    );
  };

  const handleRefresh = () => {
    if (!activeTab) {
      return;
    }

    setTabs((currentTabs) =>
      currentTabs.map((tab) => {
        if (tab.id !== activeTab.id) {
          return tab;
        }

        const currentPageState = getCurrentPageState(tab);
        const nextHistory = [...tab.history];

        nextHistory[tab.historyIndex] =
          currentPageState.kind === "external"
            ? {
                ...currentPageState,
                status: "loading",
              }
            : {
                ...currentPageState,
              };

        return {
          ...tab,
          history: nextHistory,
          refreshToken: tab.refreshToken + 1,
        };
      }),
    );
  };

  const getTabTitle = (tab: BrowserTab) => {
    const currentPageState = getCurrentPageState(tab);

    if (currentPageState.kind === "internal") {
      return t(
        browserSections.find((section) => section.id === currentPageState.sectionId)?.label ??
          browserSections[0].label,
      );
    }

    return getExternalTabTitle(currentPageState.url);
  };

  const handleIframeLoad = (tabId: string, url: string) => {
    const iframe = loadingIframeRef.current;
    let shouldMarkUnavailable = false;

    iframeLoadStateRef.current = {
      tabId,
      url,
      loaded: true,
    };

    try {
      const frameHref = iframe?.contentWindow?.location?.href ?? "";
      const frameTitle = iframe?.contentDocument?.title?.toLowerCase() ?? "";
      const frameBodyText = iframe?.contentDocument?.body?.innerText?.toLowerCase() ?? "";

      shouldMarkUnavailable =
        frameHref.startsWith("chrome-error://") ||
        frameTitle.includes("refused to connect") ||
        frameTitle.includes("can’t be reached") ||
        frameTitle.includes("can't be reached") ||
        frameBodyText.includes("refused to connect") ||
        frameBodyText.includes("can’t be reached") ||
        frameBodyText.includes("can't be reached") ||
        frameBodyText.includes("frame-ancestors") ||
        frameBodyText.includes("x-frame-options");
    } catch {
      shouldMarkUnavailable = false;
    }

    patchCurrentPageState(tabId, (currentPageState) => {
      if (
        currentPageState.kind !== "external" ||
        currentPageState.url !== url
      ) {
        return currentPageState;
      }

      return {
        ...currentPageState,
        status: shouldMarkUnavailable ? "unavailable" : "ready",
      };
    });
  };

  const activeRefreshToken = activeTab?.refreshToken ?? 0;

  return (
    <div className={`browser-app${isExternalPage ? " is-external" : ""}`}>
      <div className="browser-chrome">
        <div className="browser-tabs-shell">
          <div className="browser-tabs" role="tablist" aria-label={t("Browser tabs")}>
            {tabs.map((tab) => {
              const isActive = tab.id === activeTab?.id;

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
                    {getCurrentPageState(tab).kind === "internal" ? (
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
          <div className="browser-nav-controls" aria-label={t("Browser navigation")}>
            <button
              className="browser-toolbar-button"
              type="button"
              aria-label={t("Back")}
              disabled={!canNavigateBack}
              onClick={() => handleNavigateHistory("back")}
            >
              <ChevronLeft className="browser-toolbar-icon" />
            </button>
            <button
              className="browser-toolbar-button"
              type="button"
              aria-label={t("Forward")}
              disabled={!canNavigateForward}
              onClick={() => handleNavigateHistory("forward")}
            >
              <ChevronRight className="browser-toolbar-icon" />
            </button>
            <button
              className="browser-toolbar-button"
              type="button"
              aria-label={t("Refresh")}
              onClick={handleRefresh}
            >
              <RefreshCw className="browser-toolbar-icon" />
            </button>
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

      <div className={`browser-layout${isExternalPage ? " is-external" : " is-internal"}`}>
        <section className={`browser-panel${isExternalPage ? " is-external" : ""}`}>
          {pageState.kind === "external" ? (
            pageState.status === "ready" ? (
              <div className="browser-iframe-shell">
                <iframe
                  key={`${pageState.url}:${activeRefreshToken}`}
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
                  key={`${pageState.url}:${activeRefreshToken}:loading`}
                  className="browser-iframe browser-iframe--hidden"
                  title={pageState.url}
                  src={pageState.url}
                  loading="eager"
                  ref={loadingIframeRef}
                  referrerPolicy="strict-origin-when-cross-origin"
                  onLoad={() => activeTab && handleIframeLoad(activeTab.id, pageState.url)}
                />
              </>
            ) : (
              <BrowserUnavailable attemptedUrl={pageState.url} />
            )
          ) : (
            <div className="browser-site-shell" key={`${activeTab?.id ?? "tab"}:${activeRefreshToken}:${activeSection.id}`}>
              <header className="browser-site-header">
                <div className="browser-site-header-top">
                  <div className="browser-site-brand">
                    <span className="browser-site-brand-kicker">{t("Personal web workspace")}</span>
                    <strong>suuronen.dev</strong>
                    <p className="browser-site-tagline">
                      Emil Suuronen, backend engineer, infrastructure builder, and curious product tinkerer.
                    </p>
                  </div>
                  <div className="browser-site-meta">
                    <span>{t(activeSection.label)}</span>
                    <span>Emil Suuronen</span>
                  </div>
                </div>

                <nav className="browser-site-nav" aria-label={t("Browser sections")}>
                  {browserSections.map((section) => {
                    const SectionIcon = getSectionIcon(section.id);

                    return (
                      <button
                        key={section.id}
                        className={`browser-site-nav-button${section.id === activeSectionId ? " is-active" : ""}`}
                        type="button"
                        onClick={() => openInternalSection(section.id)}
                      >
                        <span className="browser-site-nav-button-icon" aria-hidden="true">
                          <SectionIcon className="browser-site-nav-button-icon-glyph" />
                        </span>
                        <span>{t(section.label)}</span>
                      </button>
                    );
                  })}
                </nav>
              </header>

              <main className="browser-site-main">
                <div className="browser-site-content">
                  {activeSection.id === "about" ? (
                    <div className="browser-about-hero">
                      <div className="browser-about-copy">
                        <p className="browser-eyebrow">{t(activeSection.eyebrow)}</p>
                        <h2>{t(activeSection.heading)}</h2>
                        <p className="browser-description">{t(activeSection.description)}</p>
                      </div>
                      <BrowserPixelCat />
                    </div>
                  ) : (
                    <>
                      <p className="browser-eyebrow">{t(activeSection.eyebrow)}</p>
                      <h2>{t(activeSection.heading)}</h2>
                      <p className="browser-description">{t(activeSection.description)}</p>
                    </>
                  )}
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
                </div>
              </main>

              <footer className="browser-site-footer">
                <div className="browser-site-footer-column browser-site-footer-column--brand">
                  <div className="browser-site-footer-copy">
                    <strong>Emil Suuronen</strong>
                    <p>Backend systems, creative tooling, interface experiments, and other useful things.</p>
                  </div>
                </div>

                <div className="browser-site-footer-column">
                  <span className="browser-site-footer-heading">Explore</span>
                  <div className="browser-site-footer-links">
                    {browserSections.map((section) => (
                      <button
                        key={section.id}
                        className="browser-site-footer-link"
                        type="button"
                        onClick={() => openInternalSection(section.id)}
                      >
                        {t(section.label)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="browser-site-footer-column browser-site-footer-column--contact">
                  <span className="browser-site-footer-heading">Contact</span>
                  <div className="browser-site-footer-contact-list">
                    {contactLinks.map((link) => {
                      const ContactIcon = getContactIcon(link.type);

                      return (
                        <a
                          key={link.type}
                          className="browser-site-footer-contact-link"
                          href={link.href}
                          target={link.type === "email" ? undefined : "_blank"}
                          rel={link.type === "email" ? undefined : "noreferrer"}
                        >
                          <span className="browser-site-footer-contact-icon" aria-hidden="true">
                            <ContactIcon />
                          </span>
                          <span className="browser-site-footer-contact-copy">
                            <strong>{link.label}</strong>
                            <span>{link.subtitle}</span>
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>

                <div className="browser-site-footer-meta">
                  <span>{t("Version 1.0.0")}</span>
                  <span>{t(activeSection.label)}</span>
                </div>
              </footer>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default BrowserApp;
