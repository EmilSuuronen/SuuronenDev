import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import { getInitialTerminalLines } from "../data/terminalLines";
import { useElementSize } from "../hooks/useElementSize";
import { useLocale } from "../i18n/locale";
import type { NoteFile, TerminalLine } from "../types/desktop";
import { complete, noteFiles } from "./terminal/completion";
import { displayPath, HOME } from "./terminal/filesystem";
import { TerminalEditor, TerminalPager } from "./terminal/InteractiveViews";
import {
  editLine,
  searchHistory,
  trimScrollback,
} from "./terminal/lineEditing";
import { flattenPaste } from "./terminal/parser";
import { loadShell, saveShell } from "./terminal/shell";
import type { ShellEffect } from "./terminal/types";

const COMPACT_TERMINAL_WIDTH = 720;
const EMPTY_NOTES: NoteFile[] = [];
const DEFAULT_APPS = ["terminal"];
type InteractiveMode = Extract<ShellEffect, { type: "editor" | "pager" }>;
type Props = {
  isActive?: boolean;
  notes?: NoteFile[];
  openApps?: string[];
  onOpen?: (target: string) => void;
  onExit?: () => void;
};

function TerminalPromptPrefix({ path = HOME }: { path?: string }) {
  const displayed = displayPath(path);
  return (
    <span
      className="terminal-prompt-prefix"
      aria-label={`emil@desktop:${displayed}$`}
      style={{ minWidth: 0, maxWidth: "65%" }}
    >
      <span className="terminal-prompt-user">emil</span>
      <span className="terminal-prompt-at">@</span>
      <span className="terminal-prompt-host">desktop</span>
      <span className="terminal-prompt-colon">:</span>
      <span
        className="terminal-prompt-path"
        title={path}
        style={{ overflow: "hidden", textOverflow: "ellipsis" }}
      >
        {displayed}
      </span>
      <span className="terminal-prompt-symbol">$</span>
    </span>
  );
}

function TerminalApp({
  isActive = true,
  notes = EMPTY_NOTES,
  openApps = DEFAULT_APPS,
  onOpen,
  onExit,
}: Props) {
  const { t } = useLocale();
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalSize = useElementSize(terminalRef);
  const useCompactArt =
    terminalSize.width > 0 && terminalSize.width < COMPACT_TERMINAL_WIDTH;
  const [shell] = useState(() => {
    try {
      return loadShell(window.localStorage);
    } catch {
      return loadShell();
    }
  });
  const [history, setHistory] = useState<TerminalLine[]>(() =>
    getInitialTerminalLines(false),
  );
  const [command, setCommand] = useState("");
  const [hasCommandHistory, setHasCommandHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<InteractiveMode | null>(null);
  const [search, setSearch] = useState<{
    query: string;
    index: number;
    value: string;
    original: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const interactionRef = useRef<((code: number) => void) | null>(null);
  const historyIndexRef = useRef<number | null>(null);
  const draftRef = useRef("");
  const killBufferRef = useRef("");
  const followOutputRef = useRef(true);
  const mountedRef = useRef(true);
  const storageWarnedRef = useRef(false);
  const composingRef = useRef(false);
  const callbacksRef = useRef({ onOpen, onExit });
  callbacksRef.current = { onOpen, onExit };
  shell.context.compact = useCompactArt;

  useEffect(() => {
    shell.context.notes = noteFiles(notes);
    shell.context.fs.mountNotes(shell.context.notes);
  }, [notes, shell]);

  useEffect(() => {
    shell.context.apps = openApps;
  }, [openApps, shell]);

  useEffect(() => {
    if (!hasCommandHistory) setHistory(getInitialTerminalLines(useCompactArt));
  }, [hasCommandHistory, useCompactArt]);

  useEffect(() => {
    if (isActive && !mode) inputRef.current?.focus({ preventScroll: true });
  }, [isActive, mode]);

  useEffect(() => {
    mountedRef.current = true;
    const save = () => {
      try {
        saveShell(shell, window.localStorage);
      } catch {
        /* storage may be disabled */
      }
    };
    window.addEventListener("pagehide", save);
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      interactionRef.current?.(130);
      save();
      window.removeEventListener("pagehide", save);
    };
  }, [shell]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element && followOutputRef.current)
      element.scrollTop = element.scrollHeight;
  }, [history, busy, mode, search]);

  const append = (lines: TerminalLine[]) => {
    if (mountedRef.current)
      setHistory((current) => trimScrollback([...current, ...lines]));
  };
  const persist = () => {
    let saved = false;
    try {
      saved = saveShell(shell, window.localStorage);
    } catch {
      /* storage may be disabled */
    }
    if (!saved && !storageWarnedRef.current) {
      storageWarnedRef.current = true;
      append([
        {
          kind: "error",
          literal: true,
          value:
            "Storage is unavailable or full. Your files and history will last only until this terminal closes.",
        },
      ]);
    }
    return saved;
  };
  const setInput = (value: string, cursor = value.length) => {
    setCommand(value);
    requestAnimationFrame(() =>
      inputRef.current?.setSelectionRange(cursor, cursor),
    );
  };
  const finishInteraction = (code = 0) => {
    setMode(null);
    interactionRef.current?.(code);
    interactionRef.current = null;
  };

  const submit = async (input: string) => {
    if (abortRef.current) return;
    const controller = new AbortController();
    abortRef.current = controller;
    followOutputRef.current = true;
    setHasCommandHistory(true);
    append([{ kind: "prompt", value: input, path: shell.context.cwd }]);
    setCommand("");
    setSearch(null);
    historyIndexRef.current = null;
    setBusy(true);
    try {
      await shell.execute(input, {
        signal: controller.signal,
        onOutput: append,
        onEffect: async (effect) => {
          if (!mountedRef.current) return 130;
          if (effect.type === "clear") setHistory([]);
          else if (effect.type === "exit") {
            persist();
            callbacksRef.current.onExit?.();
          } else if (effect.type === "open") {
            if (!callbacksRef.current.onOpen) {
              append([
                {
                  kind: "error",
                  value: "Desktop launcher is unavailable.",
                  literal: true,
                },
              ]);
              return 1;
            }
            callbacksRef.current.onOpen(effect.target);
          } else {
            setMode(effect);
            return await new Promise<number>((resolve) => {
              const cancel = () => {
                if (mountedRef.current) setMode(null);
                resolve(130);
              };
              controller.signal.addEventListener("abort", cancel, {
                once: true,
              });
              interactionRef.current = (code) => {
                controller.signal.removeEventListener("abort", cancel);
                resolve(code);
              };
            });
          }
        },
      });
    } finally {
      persist();
      abortRef.current = null;
      if (mountedRef.current) setBusy(false);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const key = event.key.toLowerCase();
    const ctrl =
      event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;
    if (ctrl && key === "c") {
      // Preserve native copying when output or input text is selected.
      if (
        window.getSelection()?.toString() ||
        event.currentTarget.selectionStart !== event.currentTarget.selectionEnd
      )
        return;
      event.preventDefault();
      event.stopPropagation();
      if (abortRef.current) abortRef.current.abort();
      else {
        append([
          { kind: "prompt", value: `${command}^C`, path: shell.context.cwd },
        ]);
        setHasCommandHistory(true);
        setCommand("");
        setSearch(null);
        historyIndexRef.current = null;
        shell.context.status = 130;
      }
      return;
    }
    if (ctrl && key === "l") {
      event.preventDefault();
      setHasCommandHistory(true);
      setHistory([]);
      followOutputRef.current = true;
      return;
    }
    if (busy) {
      if (event.key === "Enter") event.preventDefault();
      return;
    }
    if (ctrl && key === "r") {
      event.preventDefault();
      const query = search?.query ?? "";
      const match = searchHistory(
        shell.context.history,
        query,
        search
          ? search.index < 0
            ? shell.context.history.length
            : search.index
          : undefined,
      );
      setSearch({ query, ...match, original: search?.original ?? command });
      return;
    }
    if (search) {
      if (event.key === "Escape" || (ctrl && key === "g")) {
        event.preventDefault();
        setInput(search.original);
        setSearch(null);
      } else if (event.key === "Enter") {
        event.preventDefault();
        if (search.index >= 0) void submit(search.value);
      } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        setInput(search.index >= 0 ? search.value : search.original);
        setSearch(null);
      }
      return;
    }
    if (
      event.key === "ArrowUp" ||
      event.key === "ArrowDown" ||
      (ctrl && ["p", "n"].includes(key))
    ) {
      event.preventDefault();
      const saved = shell.context.history;
      const up = event.key === "ArrowUp" || key === "p";
      if (historyIndexRef.current === null) {
        if (!up || !saved.length) return;
        draftRef.current = command;
        historyIndexRef.current = saved.length;
      }
      const next = Math.max(
        0,
        Math.min(saved.length, historyIndexRef.current + (up ? -1 : 1)),
      );
      historyIndexRef.current = next === saved.length ? null : next;
      setInput(next === saved.length ? draftRef.current : saved[next]);
      return;
    }
    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      const completion = complete(
        command,
        event.currentTarget.selectionStart ?? command.length,
        shell.context,
      );
      setInput(completion.value, completion.cursor);
      if (completion.candidates.length > 1 && completion.value === command) {
        setHasCommandHistory(true);
        append([
          { kind: "prompt", path: shell.context.cwd, value: command },
          {
            kind: "output",
            value: completion.candidates.join("  "),
            literal: true,
          },
        ]);
      }
      return;
    }
    if (ctrl && key === "d" && !command) {
      event.preventDefault();
      void submit("exit");
      return;
    }
    if (ctrl || (event.altKey && !event.ctrlKey && ["b", "f"].includes(key))) {
      const result = editLine(
        command,
        event.currentTarget.selectionStart ?? command.length,
        event.currentTarget.selectionEnd ?? command.length,
        ctrl ? key : `alt-${key}`,
        killBufferRef.current,
      );
      if (result) {
        event.preventDefault();
        setInput(result.value, result.cursor);
        if (result.killed !== undefined) killBufferRef.current = result.killed;
      }
    }
  };

  return (
    <div
      ref={terminalRef}
      className="terminal-app"
      onClick={(event) => {
        if (
          mode ||
          window.getSelection()?.toString() ||
          (event.target as HTMLElement).closest("a,button,input,textarea")
        )
          return;
        inputRef.current?.focus({ preventScroll: true });
      }}
    >
      {mode?.type === "editor" ? (
        <TerminalEditor
          path={mode.path}
          content={mode.content}
          onDone={finishInteraction}
          onSave={(value) => {
            shell.context.fs.write(mode.path, value);
            if (!persist())
              throw new Error(
                "Saved for this session only; browser storage is unavailable.",
              );
          }}
        />
      ) : mode?.type === "pager" ? (
        <TerminalPager
          content={mode.content}
          width={terminalSize.width}
          height={terminalSize.height}
          onDone={finishInteraction}
        />
      ) : (
        <div
          ref={scrollRef}
          className="terminal-screen"
          aria-label="Terminal output"
          onScroll={(event) => {
            const element = event.currentTarget;
            followOutputRef.current =
              element.scrollHeight - element.scrollTop - element.clientHeight <
              40;
          }}
        >
          <div
            className="terminal-history"
            role="log"
            aria-label="Terminal history"
            aria-live="polite"
            aria-relevant="additions"
          >
            {history.map((line, index) =>
              line.kind === "prompt" ? (
                <div
                  key={`${line.kind}-${index}`}
                  className="terminal-prompt-row"
                >
                  <TerminalPromptPrefix path={line.path} />
                  <span className="terminal-prompt-command">{line.value}</span>
                </div>
              ) : line.kind === "link" ? (
                <p
                  key={`${line.kind}-${index}`}
                  className="terminal-line terminal-line--link"
                >
                  <span className="terminal-link-label">{t(line.label)}: </span>
                  <a
                    className="terminal-link"
                    href={line.href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {line.value}
                  </a>
                </p>
              ) : (
                <p
                  key={`${line.kind}-${index}`}
                  className={`terminal-line terminal-line--${line.kind}`}
                >
                  {line.literal ||
                  line.kind === "accent" ||
                  line.kind === "error"
                    ? line.value
                    : t(line.value)}
                </p>
              ),
            )}
            {search && (
              <p
                className={`terminal-line terminal-line--${search.index >= 0 ? "output" : "error"}`}
                role="status"
              >
                {search.index >= 0 ? search.value : "No matching command"}
              </p>
            )}
          </div>
          <form
            className="terminal-prompt-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!busy && !search && !composingRef.current)
                void submit(command);
            }}
          >
            <label className="terminal-prompt-row">
              {search ? (
                <span className="terminal-prompt-path">
                  (reverse-i-search):
                </span>
              ) : (
                !busy && <TerminalPromptPrefix path={shell.context.cwd} />
              )}
              <input
                ref={inputRef}
                className="terminal-input"
                aria-label={
                  search ? "Search command history" : "Terminal command"
                }
                aria-busy={busy}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                type="text"
                enterKeyHint="send"
                readOnly={busy}
                value={search?.query ?? command}
                onKeyDown={onKeyDown}
                onCompositionStart={() => {
                  composingRef.current = true;
                }}
                onCompositionEnd={() => {
                  composingRef.current = false;
                }}
                onPaste={(event) => {
                  const pasted = event.clipboardData.getData("text");
                  if (!/[\r\n]/.test(pasted) || search || busy) return;
                  event.preventDefault();
                  const start =
                    event.currentTarget.selectionStart ?? command.length;
                  const end =
                    event.currentTarget.selectionEnd ?? command.length;
                  try {
                    setInput(
                      flattenPaste(
                        command.slice(0, start) + pasted + command.slice(end),
                      ),
                    );
                    historyIndexRef.current = null;
                  } catch (error) {
                    setHasCommandHistory(true);
                    append([
                      {
                        kind: "error",
                        value: `Paste: ${(error as Error).message}. Paste a complete command line.`,
                        literal: true,
                      },
                    ]);
                  }
                }}
                onChange={(event) => {
                  if (search)
                    setSearch({
                      ...search,
                      query: event.target.value,
                      ...searchHistory(
                        shell.context.history,
                        event.target.value,
                      ),
                    });
                  else {
                    setCommand(event.target.value);
                    historyIndexRef.current = null;
                  }
                }}
              />
            </label>
          </form>
        </div>
      )}
    </div>
  );
}

export default TerminalApp;
