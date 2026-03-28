import { AlertTriangle, Check, Languages, MonitorCog, Palette, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";

import type { DesktopFilterId, DesktopFilterOption } from "../data/desktopFilters";
import type { DesktopTheme } from "../data/themes";
import { useLocale, type AppLocale } from "../i18n/locale";
import { resetAppData } from "../utils/resetAppData";

type SettingsAppProps = {
  activeFilterId: string;
  currentTheme: DesktopTheme;
  filterOptions: DesktopFilterOption[];
  onSelectFilter: (filterId: DesktopFilterId) => void;
  onResetTheme: () => void;
  onSelectTheme: (themeId: string) => void;
  onSetThemeColor: (
    key:
      | "accent"
      | "panel"
      | "surfaceDark"
      | "wallpaperColor1"
      | "wallpaperColor2"
      | "wallpaperColor3",
    value: string,
  ) => void;
  themeOptions: DesktopTheme[];
};

const editableColors = [
  { key: "accent", label: "Accent" },
  { key: "panel", label: "Panel surface" },
  { key: "surfaceDark", label: "Dark chrome" },
  { key: "wallpaperColor1", label: "Wallpaper highlight" },
  { key: "wallpaperColor2", label: "Wallpaper core" },
  { key: "wallpaperColor3", label: "Wallpaper shadow" },
] as const;

function SettingsApp({
  activeFilterId,
  currentTheme,
  filterOptions,
  onSelectFilter,
  onResetTheme,
  onSelectTheme,
  onSetThemeColor,
  themeOptions,
}: SettingsAppProps) {
  const { languageLabel, locale, setLocale, t, themeName } = useLocale();
  const localeOptions: AppLocale[] = ["en", "fi", "pirate", "alien"];
  const [activePage, setActivePage] = useState<"appearance" | "language" | "filters" | "reset">("appearance");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleConfirmReset = async () => {
    setIsResetting(true);
    await resetAppData();
    window.location.reload();
  };

  return (
    <div className="settings-app">
      <aside className="settings-sidebar">
        <div className="settings-sidebar-header">
          <span className="settings-sidebar-icon">
            <MonitorCog strokeWidth={1.8} />
          </span>
          <div>
            <div className="settings-sidebar-kicker">{t("Desktop Settings")}</div>
            <h2>{t("Settings")}</h2>
          </div>
        </div>

        <div className="settings-nav">
          <button
            className={`settings-nav-item${activePage === "appearance" ? " is-active" : ""}`}
            type="button"
            onClick={() => setActivePage("appearance")}
          >
            <Palette className="settings-nav-item-icon" />
            <span>{t("Appearance")}</span>
          </button>
          <button
            className={`settings-nav-item${activePage === "filters" ? " is-active" : ""}`}
            type="button"
            onClick={() => setActivePage("filters")}
          >
            <span className="settings-nav-item-icon settings-nav-item-icon--spark">✦</span>
            <span>{t("Filters")}</span>
          </button>
          <button
            className={`settings-nav-item${activePage === "language" ? " is-active" : ""}`}
            type="button"
            onClick={() => setActivePage("language")}
          >
            <Languages className="settings-nav-item-icon" />
            <span>{t("Language")}</span>
          </button>
          <button
            className={`settings-nav-item${activePage === "reset" ? " is-active" : ""}`}
            type="button"
            onClick={() => setActivePage("reset")}
          >
            <RotateCcw className="settings-nav-item-icon" />
            <span>{t("Reset")}</span>
          </button>
        </div>

        <div className="settings-sidebar-section">
          <div className="settings-sidebar-section-title">{t("System info")}</div>
          <div className="settings-sidebar-info-list">
            <div className="settings-sidebar-info-item">
              <span>{t("Current theme")}</span>
              <strong>{themeName(currentTheme.id)}</strong>
            </div>
            <div className="settings-sidebar-info-item">
              <span>{t("Current language")}</span>
              <strong>{languageLabel(locale)}</strong>
            </div>
            <div className="settings-sidebar-info-item">
              <span>{t("Current filter")}</span>
              <strong>{t(filterOptions.find((filterOption) => filterOption.id === activeFilterId)?.label ?? "No filter")}</strong>
            </div>
            <div className="settings-sidebar-info-item">
              <span>{t("Version")}</span>
              <strong>1.0.0</strong>
            </div>
            <p className="settings-sidebar-note">{t("Changes save automatically.")}</p>
          </div>
        </div>
      </aside>

      <div className="settings-main">
        {activePage === "filters" ? (
          <section className="settings-panel-card">
            <div className="settings-section-header">
              <div>
                <span className="settings-section-kicker">{t("Filters")}</span>
                <h3>{t("Apply full-screen effects")}</h3>
              </div>
            </div>

            <div className="settings-filter-grid">
              {filterOptions.map((filterOption) => {
                const isActive = filterOption.id === activeFilterId;

                return (
                  <button
                    key={filterOption.id}
                    className={`settings-filter-card settings-filter-card--${filterOption.id}${isActive ? " is-active" : ""}`}
                    type="button"
                    onClick={() => onSelectFilter(filterOption.id)}
                  >
                    <span className="settings-filter-preview" aria-hidden="true">
                      <span className="settings-filter-preview-screen" />
                    </span>
                    <span className="settings-filter-card-label">{t(filterOption.label)}</span>
                    <span className="settings-filter-card-description">{t(filterOption.description)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : activePage === "language" ? (
          <section className="settings-panel-card">
            <div className="settings-section-header">
              <div>
                <span className="settings-section-kicker">{t("Language")}</span>
                <h3>{t("Application language")}</h3>
              </div>
            </div>

            <div className="settings-language-row" role="group" aria-label={t("Application language")}>
              {localeOptions.map((localeOption) => (
                <button
                  key={localeOption}
                  className={`settings-language-chip${locale === localeOption ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setLocale(localeOption)}
                >
                  {languageLabel(localeOption)}
                </button>
              ))}
            </div>
          </section>
        ) : activePage === "reset" ? (
          <section className="settings-panel-card settings-panel-card--danger">
            <div className="settings-section-header">
              <div>
                <span className="settings-section-kicker">{t("Reset")}</span>
                <h3>{t("Reset desktop state")}</h3>
              </div>
            </div>

            <div className="settings-reset-hero">
              <span className="settings-reset-hero-icon" aria-hidden="true">
                <Sparkles strokeWidth={1.8} />
              </span>
              <div className="settings-reset-hero-copy">
                <strong>{t("Start from a clean desktop")}</strong>
                <p>{t("This clears saved notes, window state, theme, language, filters, and desktop icons from this browser.")}</p>
              </div>
            </div>

            <div className="settings-reset-list">
              <div className="settings-reset-list-item">{t("Desktop layout and icon positions")}</div>
              <div className="settings-reset-list-item">{t("Saved notes and trash contents")}</div>
              <div className="settings-reset-list-item">{t("Theme, language, and active filters")}</div>
              <div className="settings-reset-list-item">{t("Cached desktop data in this browser")}</div>
            </div>

            <div className="settings-reset-actions">
              <button
                className="settings-reset-danger-button"
                type="button"
                onClick={() => setIsResetDialogOpen(true)}
              >
                <RotateCcw className="settings-reset-danger-icon" />
                <span>{t("Reset everything")}</span>
              </button>
            </div>
          </section>
        ) : (
          <>
            <section className="settings-panel-card">
              <div className="settings-section-header">
                <div>
                  <span className="settings-section-kicker">{t("Preset themes")}</span>
                  <h3>{t("Choose a desktop mood")}</h3>
                </div>
                <button className="settings-reset-button" type="button" onClick={onResetTheme}>
                  {t("Reset to default")}
                </button>
              </div>

              <div className="settings-theme-grid">
                {themeOptions.map((theme) => {
                  const isActive = theme.id === currentTheme.id;

                  return (
                    <button
                      key={theme.id}
                      className={`settings-theme-card${isActive ? " is-active" : ""}`}
                      type="button"
                      onClick={() => onSelectTheme(theme.id)}
                    >
                      <div className="settings-theme-preview">
                        <span style={{ background: theme.wallpaperColor1 }} />
                        <span style={{ background: theme.wallpaperColor2 }} />
                        <span style={{ background: theme.wallpaperColor3 }} />
                      </div>
                      <div className="settings-theme-meta">
                        <span className="settings-theme-title">
                          {themeName(theme.id)}
                          {isActive ? <Check className="settings-theme-check" /> : null}
                        </span>
                        <span className="settings-theme-subtitle">{t("Preset desktop palette")}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="settings-panel-card">
              <div className="settings-section-header">
                <div>
                  <span className="settings-section-kicker">{t("Fine tune")}</span>
                  <h3>{t("Adjust core shell colors")}</h3>
                </div>
              </div>

              <div className="settings-color-grid">
                {editableColors.map((item) => (
                  <label key={item.key} className="settings-color-field">
                    <span className="settings-color-label">{t(item.label)}</span>
                    <span className="settings-color-control">
                      <input
                        type="color"
                        value={currentTheme[item.key]}
                        onChange={(event) => onSetThemeColor(item.key, event.target.value)}
                      />
                      <code>{currentTheme[item.key]}</code>
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </>
        )}
      </div>

      {isResetDialogOpen ? (
        <div className="settings-dialog-backdrop" role="presentation">
          <div
            aria-labelledby="settings-reset-dialog-title"
            aria-modal="true"
            className="settings-dialog"
            role="dialog"
          >
            <div className="settings-dialog-titlebar">
              <div className="settings-dialog-title">
                <span className="settings-dialog-icon" aria-hidden="true">
                  <AlertTriangle strokeWidth={1.8} />
                </span>
                <span>{t("Confirm reset")}</span>
              </div>
            </div>

            <div className="settings-dialog-body">
              <div className="settings-dialog-copy">
                <h4 id="settings-reset-dialog-title">{t("Reset desktop state")}</h4>
                <p>{t("This action clears all saved application data in this browser and reloads the desktop.")}</p>
                <p>{t("This cannot be undone.")}</p>
              </div>

              <div className="settings-dialog-actions">
                <button
                  className="settings-dialog-button"
                  type="button"
                  onClick={() => setIsResetDialogOpen(false)}
                  disabled={isResetting}
                >
                  {t("Cancel")}
                </button>
                <button
                  className="settings-dialog-button settings-dialog-button--danger"
                  type="button"
                  onClick={() => void handleConfirmReset()}
                  disabled={isResetting}
                >
                  {isResetting ? t("Resetting...") : t("Reset everything")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default SettingsApp;
