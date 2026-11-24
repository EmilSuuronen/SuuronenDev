import { useEffect, useState } from "react";

import BootSequence from "./components/desktop/BootSequence";
import TextMode from "./components/TextMode";
import { getThemeVariables, useDesktopTheme } from "./hooks/useDesktopTheme";

// The desktop (src/App.tsx) is switched off for now: every URL plays the boot animation, then shows text mode.
function SessionRoot() {
  const theme = useDesktopTheme();
  const [boot, setBoot] = useState(true);

  useEffect(() => {
    // Old /desktop and /text links still load the app; show them as the one page they now are.
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
    document.title = "Emil Suuronen · suuronen.dev";
  }, []);

  return (
    <div className="session-root" style={getThemeVariables(theme.currentTheme)}>
      <TextMode onReboot={() => setBoot(true)} />
      {boot ? <BootSequence onDone={() => setBoot(false)} themeId={theme.currentTheme.id} /> : null}
    </div>
  );
}

export default SessionRoot;
