import type { RendererMode } from "../types";

const RENDERER_MODE_STORAGE_KEY = "antgame:renderer-mode";
const DEBUG_STORAGE_KEY = "antgame:renderer-debug";

function isRendererMode(value: string | null): value is RendererMode {
  return value === "canvas2d" || value === "ogl";
}

export function resolveInitialRendererMode(): RendererMode {
  if (typeof window === "undefined") {
    return "ogl";
  }

  const params = new URLSearchParams(window.location.search);
  const queryMode = params.get("antgameRenderer");
  if (isRendererMode(queryMode)) {
    window.localStorage.setItem(RENDERER_MODE_STORAGE_KEY, queryMode);
    return queryMode;
  }

  const storedMode = window.localStorage.getItem(RENDERER_MODE_STORAGE_KEY);
  return isRendererMode(storedMode) ? storedMode : "ogl";
}

export function resolveRendererDebugEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  const params = new URLSearchParams(window.location.search);
  const queryDebug = params.get("antgameDebug");
  if (queryDebug === "1" || queryDebug === "true") {
    window.localStorage.setItem(DEBUG_STORAGE_KEY, "1");
    return true;
  }

  if (queryDebug === "0" || queryDebug === "false") {
    window.localStorage.removeItem(DEBUG_STORAGE_KEY);
    return false;
  }

  return window.localStorage.getItem(DEBUG_STORAGE_KEY) === "1";
}

export function getActiveRendererMode(requestedMode: RendererMode): RendererMode {
  return requestedMode;
}
