import { useEffect, useState } from "react";

import App from "./App";
import BootSequence, { type SessionMode } from "./components/desktop/BootSequence";
import TextMode from "./components/TextMode";
import { getThemeVariables, useDesktopTheme } from "./hooks/useDesktopTheme";

// "/" is the boot manager; each mode has its own URL so it can be linked, reloaded and navigated with back/forward.
// The build copies index.html into desktop/ and text/ so GitHub Pages serves these paths directly.
type Route = "/" | "/desktop" | "/text";

// sessionStorage: the mode picked this session, so returning to "/" skips the boot.
const SESSION_MODE_KEY = "suuronen.desktop.session-mode";
// localStorage: last pick, highlighted by default on the next visit.
const PREFERRED_MODE_KEY = "suuronen.desktop.preferred-mode";

const TITLES: Record<Route, string> = {
  "/": "Suuronen.dev",
  "/desktop": "Suuronen.dev · Desktop",
  "/text": "Emil Suuronen · suuronen.dev",
};

function parseRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === "/desktop" || path === "/text" ? path : "/";
}

const routeMode = (route: Route): SessionMode | null =>
  route === "/desktop" ? "desktop" : route === "/text" ? "text" : null;

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
    // storage blocked: the boot manager just shows again next visit
  }
}

function getInitialState(): { boot: "full" | "desktop" | null; route: Route } {
  const route = parseRoute(window.location.pathname);
  const sessionMode = readMode(() => window.sessionStorage, SESSION_MODE_KEY);

  if (route === "/") {
    if (sessionMode) {
      window.history.replaceState(null, "", `/${sessionMode}`);
      return { boot: null, route: `/${sessionMode}` };
    }

    return { boot: "full", route };
  }

  if (route !== window.location.pathname) {
    window.history.replaceState(null, "", route);
  }

  // A direct link to the desktop still gets the short load screen on the first visit of a session.
  return { boot: route === "/desktop" && !sessionMode ? "desktop" : null, route };
}

function SessionRoot() {
  const theme = useDesktopTheme();
  const [initial] = useState(getInitialState);
  const [route, setRoute] = useState(initial.route);
  const [boot, setBoot] = useState(initial.boot);
  const mode = routeMode(route);

  const navigate = (next: Route) => {
    if (next !== parseRoute(window.location.pathname)) {
      window.history.pushState(null, "", next);
    }
    setRoute(next);
  };

  const choose = (next: SessionMode) => {
    navigate(`/${next}`);
    writeMode(() => window.sessionStorage, SESSION_MODE_KEY, next);
    writeMode(() => window.localStorage, PREFERRED_MODE_KEY, next);
  };

  useEffect(() => {
    const handlePopState = () => {
      const next = parseRoute(window.location.pathname);
      setRoute(next);
      setBoot(next === "/" ? "full" : null);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    document.title = TITLES[route];
  }, [route]);

  return (
    <div className="session-root" style={getThemeVariables(theme.currentTheme)}>
      {mode === "desktop" ? (
        <App
          onReboot={() => {
            navigate("/");
            setBoot("full");
          }}
          theme={theme}
        />
      ) : null}
      {mode === "text" ? (
        <TextMode
          onOpenDesktop={() => {
            setBoot("desktop");
          }}
        />
      ) : null}
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
