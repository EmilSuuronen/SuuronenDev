import { ChevronDown, ChevronRight, Crosshair, ExternalLink, FileCode2, FolderTree, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";

import { useElementSize } from "../../hooks/useElementSize";
import { useLocale } from "../../i18n/locale";
import CodeEditor from "./CodeEditor";
import { sourceFiles, sourcePaths } from "./sourceFiles";
import { findClassSource, fuzzyScore, getLanguageLabel, resolveImport, type SourceLocation } from "./sourceIndex";

const REPO_URL = "https://github.com/EmilSuuronen/SuuronenDev/blob/main";
const DEFAULT_FILE = "src/App.tsx";
const NARROW_WIDTH = 640;

type CodeAppProps = {
  onFocusSelf: () => void;
};

type TreeNode = { children: Map<string, TreeNode>; path: string };

function buildTree(paths: string[]) {
  const root: TreeNode = { children: new Map(), path: "" };

  paths.forEach((path) => {
    let node = root;
    path.split("/").forEach((segment, index, segments) => {
      if (!node.children.has(segment)) {
        node.children.set(segment, { children: new Map(), path: segments.slice(0, index + 1).join("/") });
      }
      node = node.children.get(segment)!;
    });
  });

  return root;
}

function getAncestors(path: string) {
  return path
    .split("/")
    .slice(0, -1)
    .map((_, index, segments) => segments.slice(0, index + 1).join("/"));
}

const fileTree = buildTree(sourcePaths);

function CodeApp({ onFocusSelf }: CodeAppProps) {
  const { t } = useLocale();
  const rootRef = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(rootRef);
  const [tabs, setTabs] = useState<string[]>([DEFAULT_FILE]);
  const [activePath, setActivePath] = useState<string | null>(DEFAULT_FILE);
  const [expanded, setExpanded] = useState(() => new Set(["src", ...getAncestors(DEFAULT_FILE)]));
  const [explorerPreference, setExplorerPreference] = useState<boolean | null>(null);
  const [cursor, setCursor] = useState({ column: 1, line: 1 });
  const [jump, setJump] = useState<{ line: number; nonce: number; path: string } | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isNarrow = width > 0 && width < NARROW_WIDTH;
  const isExplorerOpen = explorerPreference ?? !isNarrow;

  const openFile = (path: string, line?: number) => {
    setTabs((current) => (current.includes(path) ? current : [...current, path]));
    setActivePath(path);
    setExpanded((current) => new Set([...current, ...getAncestors(path)]));
    setStatusMessage(null);

    if (line) {
      setJump({ line, nonce: Date.now(), path });
    }

    if (isNarrow) {
      setExplorerPreference(false);
    }
  };

  const closeTab = (path: string) => {
    const nextTabs = tabs.filter((tab) => tab !== path);
    setTabs(nextTabs);

    if (activePath === path) {
      const closedIndex = tabs.indexOf(path);
      setActivePath(nextTabs[Math.min(closedIndex, nextTabs.length - 1)] ?? null);
    }
  };

  const toggleFolder = (path: string) => {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }

      return next;
    });
  };

  const handleOpenImport = (specifier: string) => {
    const target = activePath ? resolveImport(activePath, specifier, sourceFiles) : null;

    if (target) {
      openFile(target);
    } else {
      setStatusMessage(`${specifier}: ${t("not a source file")}`);
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
      event.preventDefault();
      setIsPaletteOpen(true);
    }
  };

  const renderTree = (node: TreeNode, depth: number) =>
    [...node.children.entries()]
      .sort(([leftName, left], [rightName, right]) => {
        const leftIsFolder = left.children.size > 0;
        const rightIsFolder = right.children.size > 0;
        return leftIsFolder === rightIsFolder ? leftName.localeCompare(rightName) : leftIsFolder ? -1 : 1;
      })
      .map(([name, child]) => {
        const isFolder = child.children.size > 0;
        const isOpen = expanded.has(child.path);

        return (
          <li key={child.path}>
            <button
              className={`code-tree-item ${child.path === activePath ? "is-active" : ""}`}
              onClick={() => (isFolder ? toggleFolder(child.path) : openFile(child.path))}
              style={{ paddingLeft: `${0.5 + depth * 0.85}rem` }}
              type="button"
            >
              {isFolder ? (
                isOpen ? <ChevronDown className="code-tree-icon" /> : <ChevronRight className="code-tree-icon" />
              ) : (
                <FileCode2 className="code-tree-icon" />
              )}
              <span>{name}</span>
            </button>
            {isFolder && isOpen ? <ul>{renderTree(child, depth + 1)}</ul> : null}
          </li>
        );
      });

  return (
    <div ref={rootRef} className={`code-app ${isNarrow ? "is-narrow" : ""}`} onKeyDown={handleKeyDown}>
      <header className="code-toolbar">
        <button
          aria-pressed={isExplorerOpen}
          className="code-toolbar-button"
          onClick={() => setExplorerPreference(!isExplorerOpen)}
          title={t("Toggle explorer")}
          type="button"
        >
          <FolderTree className="code-toolbar-icon" />
        </button>
        <button className="code-toolbar-search" onClick={() => setIsPaletteOpen(true)} type="button">
          <Search className="code-toolbar-icon" />
          <span>{t("Go to file")}</span>
          <kbd>Ctrl P</kbd>
        </button>
        <button
          aria-pressed={isInspecting}
          className="code-toolbar-button code-toolbar-button--inspect"
          onClick={() => setIsInspecting(true)}
          title={t("Click anything on the desktop to open its source")}
          type="button"
        >
          <Crosshair className="code-toolbar-icon" />
          <span>{t("Inspect")}</span>
        </button>
        {activePath ? (
          <a
            className="code-toolbar-button"
            href={`${REPO_URL}/${activePath}`}
            rel="noopener noreferrer"
            target="_blank"
            title={t("View on GitHub")}
          >
            <ExternalLink className="code-toolbar-icon" />
          </a>
        ) : null}
      </header>

      <div className="code-body">
        {isExplorerOpen ? (
          <nav className="code-explorer" aria-label={t("Explorer")}>
            <div className="code-explorer-title">{t("Explorer")}</div>
            <ul className="code-tree">{renderTree(fileTree, 0)}</ul>
          </nav>
        ) : null}

        <section className="code-main">
          <div className="code-tabs" role="tablist">
            {tabs.map((path) => (
              <div
                key={path}
                className={`code-tab ${path === activePath ? "is-active" : ""}`}
                onAuxClick={(event) => event.button === 1 && closeTab(path)}
                role="tab"
                aria-selected={path === activePath}
              >
                <button className="code-tab-label" onClick={() => setActivePath(path)} title={path} type="button">
                  {path.slice(path.lastIndexOf("/") + 1)}
                </button>
                <button
                  aria-label={`${t("Close")} ${path}`}
                  className="code-tab-close"
                  onClick={() => closeTab(path)}
                  type="button"
                >
                  <X className="code-tab-close-icon" />
                </button>
              </div>
            ))}
          </div>

          {activePath ? (
            <CodeEditor
              content={sourceFiles[activePath]}
              jump={jump}
              onCursorChange={(line, column) => setCursor({ column, line })}
              onOpenImport={handleOpenImport}
              path={activePath}
            />
          ) : (
            <div className="code-empty">
              <p>{t("No file open")}</p>
              <p>
                <kbd>Ctrl P</kbd> {t("to find a file, or Inspect to pick one from the desktop")}
              </p>
            </div>
          )}

          <footer className="code-statusbar">
            <span className="code-statusbar-path">{statusMessage ?? activePath ?? ""}</span>
            {activePath ? (
              <>
                <span>
                  {t("Ln")} {cursor.line}, {t("Col")} {cursor.column}
                </span>
                <span>{getLanguageLabel(activePath)}</span>
                <span>{t("Read-only")}</span>
              </>
            ) : null}
          </footer>
        </section>
      </div>

      {isPaletteOpen ? (
        <QuickOpen
          onClose={() => setIsPaletteOpen(false)}
          onOpen={(path) => {
            setIsPaletteOpen(false);
            openFile(path);
          }}
        />
      ) : null}

      {isInspecting ? (
        <InspectOverlay
          onCancel={() => setIsInspecting(false)}
          onPick={(location) => {
            setIsInspecting(false);
            openFile(location.path, location.line);
            onFocusSelf();
          }}
        />
      ) : null}
    </div>
  );
}

function QuickOpen({ onClose, onOpen }: { onClose: () => void; onOpen: (path: string) => void }) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(
    () =>
      sourcePaths
        .map((path) => ({ path, score: fuzzyScore(query, path) }))
        .filter((result) => result.score >= 0)
        .sort((left, right) => right.score - left.score)
        .slice(0, 40),
    [query],
  );

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setSelectedIndex((index) => (index + step + results.length) % Math.max(results.length, 1));
    } else if (event.key === "Enter" && results[selectedIndex]) {
      onOpen(results[selectedIndex].path);
    } else if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
  };

  return (
    <div className="code-palette-backdrop" onPointerDown={onClose}>
      <div className="code-palette" onPointerDown={(event) => event.stopPropagation()}>
        <input
          autoFocus
          aria-label={t("Go to file")}
          className="code-palette-input"
          onChange={(event) => {
            setQuery(event.target.value);
            setSelectedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={t("Search files by name")}
          value={query}
        />
        <ul className="code-palette-results" role="listbox">
          {results.map((result, index) => (
            <li key={result.path}>
              <button
                aria-selected={index === selectedIndex}
                className={`code-palette-item ${index === selectedIndex ? "is-active" : ""}`}
                onClick={() => onOpen(result.path)}
                onPointerEnter={() => setSelectedIndex(index)}
                role="option"
                type="button"
              >
                <strong>{result.path.slice(result.path.lastIndexOf("/") + 1)}</strong>
                <span>{result.path}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const IGNORED_CLASS_PREFIXES = ["is-", "has-", "lucide", "cm-"];

function locateElement(element: Element | null, cache: Map<string, SourceLocation | null>) {
  for (let current = element; current; current = current.parentElement) {
    for (const className of current.classList) {
      if (IGNORED_CLASS_PREFIXES.some((prefix) => className.startsWith(prefix))) {
        continue;
      }

      if (!cache.has(className)) {
        cache.set(className, findClassSource(className, sourceFiles));
      }

      const location = cache.get(className);

      if (location) {
        return { element: current, location };
      }
    }
  }

  return null;
}

function InspectOverlay({ onCancel, onPick }: { onCancel: () => void; onPick: (location: SourceLocation) => void }) {
  const { t } = useLocale();
  const [hover, setHover] = useState<{ location: SourceLocation; rect: DOMRect } | null>(null);
  const callbacksRef = useRef({ onCancel, onPick });
  callbacksRef.current = { onCancel, onPick };

  useEffect(() => {
    const cache = new Map<string, SourceLocation | null>();
    const findTarget = (event: Event) => locateElement(event.target as Element | null, cache);

    const handleMove = (event: PointerEvent) => {
      const target = findTarget(event);
      setHover(target ? { location: target.location, rect: target.element.getBoundingClientRect() } : null);
    };
    // Swallow the pointer sequence so the picked element doesn't also react (drag, open, focus).
    const block = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    const handleClick = (event: MouseEvent) => {
      block(event);
      const target = findTarget(event);

      if (target) {
        callbacksRef.current.onPick(target.location);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        block(event);
        callbacksRef.current.onCancel();
      }
    };

    document.body.classList.add("is-code-inspecting");
    window.addEventListener("pointermove", handleMove, true);
    window.addEventListener("pointerdown", block, true);
    window.addEventListener("pointerup", block, true);
    window.addEventListener("click", handleClick, true);
    window.addEventListener("contextmenu", block, true);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.body.classList.remove("is-code-inspecting");
      window.removeEventListener("pointermove", handleMove, true);
      window.removeEventListener("pointerdown", block, true);
      window.removeEventListener("pointerup", block, true);
      window.removeEventListener("click", handleClick, true);
      window.removeEventListener("contextmenu", block, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  return createPortal(
    <div className="code-inspect-layer" aria-live="polite">
      <div className="code-inspect-hint">{t("Click anything to open its source · Esc to cancel")}</div>
      {hover ? (
        <div
          className="code-inspect-box"
          style={{ height: hover.rect.height, left: hover.rect.left, top: hover.rect.top, width: hover.rect.width }}
        >
          <span
            className="code-inspect-label"
            style={hover.rect.left > window.innerWidth - 220 ? { left: "auto", right: -2 } : undefined}
          >
            {hover.location.path.slice(hover.location.path.lastIndexOf("/") + 1)}:{hover.location.line}
          </span>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

export default CodeApp;
