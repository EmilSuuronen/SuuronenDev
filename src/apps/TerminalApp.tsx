import { useEffect, useRef, useState } from "react";

import { findTerminalCommand, getHelpTerminalLines } from "../data/terminalCommands";
import { getInitialTerminalLines } from "../data/terminalLines";
import { useElementSize } from "../hooks/useElementSize";
import type { TerminalLine } from "../types/desktop";

const PROMPT_PREFIX = "emil@desktop:~$";
const COMPACT_TERMINAL_WIDTH = 720;

function TerminalPromptPrefix() {
  return (
    <span className="terminal-prompt-prefix" aria-label={PROMPT_PREFIX}>
      <span className="terminal-prompt-user">emil</span>
      <span className="terminal-prompt-at">@</span>
      <span className="terminal-prompt-host">desktop</span>
      <span className="terminal-prompt-colon">:</span>
      <span className="terminal-prompt-path">~</span>
      <span className="terminal-prompt-symbol">$</span>
    </span>
  );
}

function TerminalApp() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalSize = useElementSize(terminalRef);
  const useCompactArt = terminalSize.width > 0 && terminalSize.width < COMPACT_TERMINAL_WIDTH;
  const [history, setHistory] = useState<TerminalLine[]>(() => getInitialTerminalLines(false));
  const [command, setCommand] = useState("");
  const [hasCommandHistory, setHasCommandHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasCommandHistory) {
      setHistory(getInitialTerminalLines(useCompactArt));
    }
  }, [hasCommandHistory, useCompactArt]);

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
    let nextEntries: TerminalLine[] = [...history, { kind: "prompt", value: submittedCommand }];

    if (submittedCommand) {
      const normalizedCommand = submittedCommand.toLowerCase();

      if (normalizedCommand === "help") {
        nextEntries = [...nextEntries, ...getHelpTerminalLines()];
      } else {
        const matchedCommand = findTerminalCommand(normalizedCommand);

        if (matchedCommand) {
          nextEntries = [...nextEntries, ...matchedCommand.output];
        } else {
          nextEntries.push({
            kind: "error",
            value: `bash: ${submittedCommand}: command not found`,
          });
        }
      }
    }

    setHistory(nextEntries);
    setHasCommandHistory(true);
    setCommand("");
  };

  return (
    <div
      ref={terminalRef}
      className="terminal-app"
      onClick={() => {
        inputRef.current?.focus();
      }}
    >
      <div ref={scrollRef} className="terminal-screen" aria-label="Terminal output">
        <div className="terminal-history">
          {history.map((line, index) =>
            line.kind === "prompt" ? (
              <div key={`${line.kind}-${index}`} className="terminal-prompt-row">
                <TerminalPromptPrefix />
                <span className="terminal-prompt-command">{line.value}</span>
              </div>
            ) : line.kind === "link" ? (
              <p key={`${line.kind}-${index}`} className="terminal-line terminal-line--link">
                <span className="terminal-link-label">{line.label}: </span>
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
              <p key={`${line.kind}-${index}`} className={`terminal-line terminal-line--${line.kind}`}>
                {line.value}
              </p>
            ),
          )}
        </div>

        <form className="terminal-prompt-form" onSubmit={handleSubmit}>
          <label className="terminal-prompt-row">
            <TerminalPromptPrefix />
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
