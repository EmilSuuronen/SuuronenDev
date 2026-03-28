import { Check, Languages, MonitorCog, Palette } from "lucide-react";
import { useState } from "react";

import type { DesktopTheme } from "../data/themes";
import { useLocale, type AppLocale } from "../i18n/locale";

type SettingsAppProps = {
  currentTheme: DesktopTheme;
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
  currentTheme,
  onResetTheme,
  onSelectTheme,
  onSetThemeColor,
  themeOptions,
}: SettingsAppProps) {
  const { languageLabel, locale, setLocale, t, themeName } = useLocale();
  const localeOptions: AppLocale[] = ["en", "fi", "pirate", "alien"];
  const [activePage, setActivePage] = useState<"appearance" | "language">("appearance");

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
            className={`settings-nav-item${activePage === "language" ? " is-active" : ""}`}
            type="button"
            onClick={() => setActivePage("language")}
          >
            <Languages className="settings-nav-item-icon" />
            <span>{t("Language")}</span>
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
              <span>{t("Version")}</span>
              <strong>1.0.0</strong>
            </div>
            <p className="settings-sidebar-note">{t("Changes save automatically.")}</p>
          </div>
        </div>
      </aside>

      <div className="settings-main">
        {activePage === "language" ? (
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
    </div>
  );
}

export default SettingsApp;
