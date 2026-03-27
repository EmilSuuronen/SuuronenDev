import { useEffect, useRef, useState } from "react";

import { initialTerminalLines } from "../data/terminalLines";
import type { TerminalLine } from "../types/desktop";

const PROMPT_PREFIX = "emil@desktop:~$";

function TerminalApp() {
  const [history, setHistory] = useState<TerminalLine[]>(initialTerminalLines);
  const [command, setCommand] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const scrollElement = scrollRef.current;

    if (!scrollElement) {
      return;
    }

    scrollElement.scrollTop = scrollElement.scrollHeight;
  }, [history, command]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const submittedCommand = command.trim();
    const nextEntries: TerminalLine[] = [
      ...history,
      { kind: "prompt", value: submittedCommand },
    ];

    if (submittedCommand) {
      nextEntries.push({
        kind: "error",
        value: `bash: ${submittedCommand}: command not found`,
      });
    }

    setHistory(nextEntries);
    setCommand("");
  };

  return (
    <div
      className="terminal-app"
      onClick={() => {
        inputRef.current?.focus();
      }}
    >
      <div className="terminal-status">
        <span className="terminal-pill">online</span>
        <span className="terminal-pill terminal-pill--muted">bash session</span>
      </div>

      <div ref={scrollRef} className="terminal-screen" aria-label="Terminal output">
        <div className="terminal-history">
          {history.map((line, index) =>
            line.kind === "prompt" ? (
              <div key={`${line.kind}-${index}`} className="terminal-prompt-row">
                <span className="terminal-prompt-prefix">{PROMPT_PREFIX}</span>
                <span className="terminal-prompt-command">{line.value}</span>
              </div>
            ) : (
              <p key={`${line.kind}-${index}`} className={`terminal-line terminal-line--${line.kind}`}>
                {line.value}
              </p>
            ),
          )}
        </div>

        <form className="terminal-prompt-form" onSubmit={handleSubmit}>
          <label className="terminal-prompt-row">
            <span className="terminal-prompt-prefix">{PROMPT_PREFIX}</span>
            <input
              ref={inputRef}
              className="terminal-input"
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              type="text"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
            />
          </label>
        </form>
      </div>
    </div>
  );
}

export default TerminalApp;
