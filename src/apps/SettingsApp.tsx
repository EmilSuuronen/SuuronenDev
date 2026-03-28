import { Check, MonitorCog, Palette } from "lucide-react";
import type { DesktopTheme } from "../data/themes";

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
  return (
    <div className="settings-app">
      <aside className="settings-sidebar">
        <div className="settings-sidebar-header">
          <span className="settings-sidebar-icon">
            <MonitorCog strokeWidth={1.8} />
          </span>
          <div>
            <div className="settings-sidebar-kicker">Desktop Settings</div>
            <h2>Appearance</h2>
          </div>
        </div>

        <div className="settings-nav">
          <div className="settings-nav-item is-active">
            <Palette className="settings-nav-item-icon" />
            <span>Appearance</span>
          </div>
        </div>
      </aside>

      <div className="settings-main">
        <section className="settings-panel-card">
          <div className="settings-section-header">
            <div>
              <span className="settings-section-kicker">Preset themes</span>
              <h3>Choose a desktop mood</h3>
            </div>
            <button className="settings-reset-button" type="button" onClick={onResetTheme}>
              Reset to default
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
                      {theme.id.replace(/-/g, " ")}
                      {isActive ? <Check className="settings-theme-check" /> : null}
                    </span>
                    <span className="settings-theme-subtitle">Preset desktop palette</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="settings-panel-card">
          <div className="settings-section-header">
            <div>
              <span className="settings-section-kicker">Fine tune</span>
              <h3>Adjust core shell colors</h3>
            </div>
          </div>

          <div className="settings-color-grid">
            {editableColors.map((item) => (
              <label key={item.key} className="settings-color-field">
                <span className="settings-color-label">{item.label}</span>
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
      </div>
    </div>
  );
}

export default SettingsApp;
