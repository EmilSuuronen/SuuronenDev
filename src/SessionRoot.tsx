import { useEffect, useState } from "react";

import BootSequence from "./components/desktop/BootSequence";
import TextMode, { type TextModePage } from "./components/TextMode";
import { getThemeVariables, useDesktopTheme } from "./hooks/useDesktopTheme";

// The desktop (src/App.tsx) is switched off for now: every URL plays the boot animation, then shows text mode.
// Text mode is the home page plus /projects; add new pages to spaRoutes in vite.config.ts too.
const TITLES: Record<TextModePage, string> = {
  "/": "Emil Suuronen · suuronen.dev",
  "/projects": "Projects · Emil Suuronen",
};

const readPage = (): TextModePage => (window.location.pathname.replace(/\/+$/, "") === "/projects" ? "/projects" : "/");

function SessionRoot() {
  const theme = useDesktopTheme();
  const [boot, setBoot] = useState(true);
  const [page, setPage] = useState(readPage);

  useEffect(() => {
    // Old /desktop and /text links still load the app; show them as home.
    if (window.location.pathname !== readPage()) {
      window.history.replaceState(null, "", readPage());
    }
    const handlePopState = () => setPage(readPage());

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.title = TITLES[page];
  }, [page]);

  const navigate = (next: TextModePage) => {
    window.history.pushState(null, "", next);
    setPage(next);
  };

  return (
    <div className="session-root" style={getThemeVariables(theme.currentTheme)}>
      <TextMode onNavigate={navigate} onReboot={() => setBoot(true)} page={page} />
      {boot ? <BootSequence onDone={() => setBoot(false)} themeId={theme.currentTheme.id} /> : null}
    </div>
  );
}

export default SessionRoot;
