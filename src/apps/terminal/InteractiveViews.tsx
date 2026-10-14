import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";

const actionStyle: CSSProperties = {
  background: "transparent",
  border: 0,
  padding: 0,
  font: "inherit",
  cursor: "pointer",
};

export function TerminalPager({
  content,
  width,
  height,
  onDone,
}: {
  content: string;
  width: number;
  height: number;
  onDone: (code?: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const columns = Math.max(20, Math.floor((width - 40) / 8));
  const rows = Math.max(3, Math.floor((height - 75) / 20));
  const lines = content
    .replace(/\n$/, "")
    .split("\n")
    .flatMap((line) => {
      const chars = [...line];
      return chars.length
        ? Array.from(
            { length: Math.ceil(chars.length / columns) },
            (_, index) =>
              chars.slice(index * columns, (index + 1) * columns).join(""),
          )
        : [""];
    });
  const max = Math.max(0, lines.length - rows);
  const start = Math.min(offset, max);
  const move = (amount: number) =>
    setOffset(Math.max(0, Math.min(max, start + amount)));
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      (event.target as HTMLElement).closest("button") &&
      ["Enter", " "].includes(event.key)
    )
      return;
    if (
      event.key === "q" ||
      event.key === "Escape" ||
      (event.ctrlKey && event.key.toLowerCase() === "c")
    ) {
      event.preventDefault();
      event.stopPropagation();
      onDone(event.ctrlKey ? 130 : 0);
      return;
    }
    const movements: Record<string, number> = {
      " ": rows,
      PageDown: rows,
      f: rows,
      PageUp: -rows,
      b: -rows,
      ArrowDown: 1,
      Enter: 1,
      j: 1,
      ArrowUp: -1,
      k: -1,
      Home: -lines.length,
      g: -lines.length,
      End: lines.length,
      G: lines.length,
    };
    if (Object.prototype.hasOwnProperty.call(movements, event.key)) {
      event.preventDefault();
      event.stopPropagation();
      move(movements[event.key]);
    }
  };
  return (
    <div
      ref={ref}
      className="terminal-screen"
      tabIndex={0}
      aria-label="Terminal pager"
      onKeyDown={onKeyDown}
    >
      <div className="terminal-history">
        <p className="terminal-line terminal-line--output">
          {lines.slice(start, start + rows).join("\n")}
        </p>
      </div>
      <div className="terminal-prompt-row" style={{ flexWrap: "wrap" }}>
        <span className="terminal-prompt-path">
          {start >= max
            ? "(END)"
            : `${start + 1}–${Math.min(lines.length, start + rows)}/${lines.length}`}
        </span>
        <button
          type="button"
          className="terminal-link"
          style={actionStyle}
          onClick={() => move(-rows)}
        >
          Back (b)
        </button>
        <button
          type="button"
          className="terminal-link"
          style={actionStyle}
          onClick={() => move(rows)}
        >
          Next (Space)
        </button>
        <button
          type="button"
          className="terminal-link"
          style={actionStyle}
          onClick={() => onDone()}
        >
          Quit (q)
        </button>
      </div>
    </div>
  );
}

export function TerminalEditor({
  path,
  content,
  onSave,
  onDone,
}: {
  path: string;
  content: string;
  onSave: (value: string) => void;
  onDone: (code?: number) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(content);
  const [saved, setSaved] = useState(content);
  const [status, setStatus] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const save = () => {
    try {
      onSave(value);
      setSaved(value);
      setStatus(`Wrote ${new TextEncoder().encode(value).length} bytes`);
      setConfirmExit(false);
      return true;
    } catch (error) {
      setConfirmExit(false);
      setStatus((error as Error).message);
      return false;
    }
  };
  const close = () => {
    if (value !== saved) setConfirmExit(true);
    else onDone();
  };
  const finish = (choice: string) => {
    if (choice === "n") onDone();
    else if (choice === "y") {
      if (save()) onDone();
    } else if (choice === "c" || choice === "Escape") {
      setConfirmExit(false);
      ref.current?.focus();
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (confirmExit) {
      if (event.key === "Tab") return;
      event.preventDefault();
      event.stopPropagation();
      finish(event.key === "Escape" ? "Escape" : event.key.toLowerCase());
      return;
    }
    const key = event.key.toLowerCase();
    if (
      (event.ctrlKey && ["o", "s", "x", "c"].includes(key)) ||
      event.key === "Escape"
    ) {
      event.preventDefault();
      event.stopPropagation();
      if (key === "o" || key === "s") save();
      else if (key === "c") setStatus("Use Ctrl+X or Escape to exit.");
      else close();
    } else if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      const start = event.currentTarget.selectionStart;
      const end = event.currentTarget.selectionEnd;
      setValue(value.slice(0, start) + "\t" + value.slice(end));
      requestAnimationFrame(() =>
        ref.current?.setSelectionRange(start + 1, start + 1),
      );
    }
  };
  return (
    <div className="terminal-screen">
      <div
        className="terminal-history"
        style={{ minHeight: 0, gridTemplateRows: "auto minmax(0, 1fr) auto" }}
      >
        <p className="terminal-line terminal-line--accent">
          nano — {path}
          {value !== saved ? " *" : ""}
        </p>
        <div className="terminal-prompt-row" style={{ minHeight: 0 }}>
          <textarea
            ref={ref}
            className="terminal-input"
            style={{
              width: "100%",
              height: "100%",
              resize: "none",
              whiteSpace: "pre",
              overflow: "auto",
            }}
            aria-label={`Edit ${path}`}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
        <p className="terminal-line terminal-line--output" role="status">
          {confirmExit
            ? "Save modified buffer? (y)es / (n)o / (c)ancel"
            : status}
        </p>
      </div>
      <div className="terminal-prompt-row" style={{ flexWrap: "wrap" }}>
        {confirmExit ? (
          <>
            <button
              type="button"
              className="terminal-link"
              style={actionStyle}
              onClick={() => finish("y")}
            >
              Yes (y)
            </button>
            <button
              type="button"
              className="terminal-link"
              style={actionStyle}
              onClick={() => finish("n")}
            >
              No (n)
            </button>
            <button
              type="button"
              className="terminal-link"
              style={actionStyle}
              onClick={() => finish("c")}
            >
              Cancel (c)
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="terminal-link"
              style={actionStyle}
              onClick={() => save()}
            >
              Save (^O)
            </button>
            <button
              type="button"
              className="terminal-link"
              style={actionStyle}
              onClick={close}
            >
              Exit (^X)
            </button>
          </>
        )}
      </div>
    </div>
  );
}
