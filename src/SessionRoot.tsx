import { useState } from "react";

import App from "./App";
import BootSequence, { type SessionMode } from "./components/desktop/BootSequence";
import TextMode from "./components/TextMode";
import { getThemeVariables, useDesktopTheme } from "./hooks/useDesktopTheme";

// sessionStorage: the mode picked this session, so a reload skips the boot.
const SESSION_MODE_KEY = "suuronen.desktop.session-mode";
// localStorage: last pick, highlighted by default on the next visit.
const PREFERRED_MODE_KEY = "suuronen.desktop.preferred-mode";

function readMode(storage: () => Storage, key: string): SessionMode | null {
  try {
    const value = storage().getItem(key);
    return value === "desktop" || value === "text" ? value : null;
  } catch {
    return null;
  }
}

function writeMode(storage: () => Storage, key: string, mode: SessionMode) {
  try {
    storage().setItem(key, mode);
  } catch {
    // storage blocked: the boot menu just shows again next load
  }
}

function SessionRoot() {
  const theme = useDesktopTheme();
  const [mode, setMode] = useState(() => readMode(() => window.sessionStorage, SESSION_MODE_KEY));
  const [boot, setBoot] = useState<"full" | "desktop" | null>(() => (mode ? null : "full"));

  const choose = (next: SessionMode) => {
    setMode(next);
    writeMode(() => window.sessionStorage, SESSION_MODE_KEY, next);
    writeMode(() => window.localStorage, PREFERRED_MODE_KEY, next);
  };

  return (
    <div className="session-root" style={getThemeVariables(theme.currentTheme)}>
      {mode === "desktop" ? <App onReboot={() => setBoot("full")} theme={theme} /> : null}
      {mode === "text" ? <TextMode onLaunchDesktop={() => setBoot("desktop")} onReboot={() => setBoot("full")} /> : null}
      {boot ? (
        <BootSequence
          entry={boot}
          initialChoice={mode ?? readMode(() => window.localStorage, PREFERRED_MODE_KEY) ?? "desktop"}
          onChoose={choose}
          onDone={() => setBoot(null)}
          themeId={theme.currentTheme.id}
        />
      ) : null}
    </div>
  );
}

export default SessionRoot;
