import { useEffect, useRef, useState } from "react";

type BootSequenceProps = {
  onDone: () => void;
  themeId: string;
};

// Power-on and log take 1.45s, then the screen fades into the page underneath.
const CRT_END = 400;
const LOG_END = 1450;
const FADE_MS = 300;

function getBootLines(themeId: string) {
  return [
    "BIOS v1.0.0  (c) 2026 Emil Suuronen",
    "CPU: Exists",
    "Memory test: 16384K OK",
    "Detecting drives... /dev/portfolio",
    "",
    "Booting suuronen.dev (linux-ish 6.18)",
    "[  OK  ] Mounted /home/emil",
    "[  OK  ] Started shell",
    `[  OK  ] Loaded theme ${themeId}`,
    "[  OK  ] Reached target Setup",
    "[  OK  ] Reached target Portfolio",
    "",
    "Starting in text mode...",
  ];
}

function BootSequence({ onDone, themeId }: BootSequenceProps) {
  const [reducedMotion] = useState(() => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
  const startRef = useRef(performance.now());
  const [elapsed, setElapsed] = useState(0);
  const crtEnd = reducedMotion ? 0 : CRT_END;
  const logEnd = reducedMotion ? 0 : LOG_END;
  const fadeMs = reducedMotion ? 0 : FADE_MS;
  const phase = elapsed < crtEnd ? "crt" : elapsed < logEnd ? "log" : elapsed < logEnd + fadeMs ? "fade" : "done";

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      setElapsed(performance.now() - startRef.current);
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (phase === "done") {
      onDone();
    }
  });

  // Any key or click skips straight to the fade.
  useEffect(() => {
    const skip = () => {
      startRef.current = Math.min(startRef.current, performance.now() - logEnd);
    };

    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);

    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [logEnd]);

  const lines = getBootLines(themeId);
  const lineDuration = (logEnd - crtEnd) / lines.length;
  const visibleLines = phase === "log" ? Math.min(lines.length, Math.floor((elapsed - crtEnd) / lineDuration) + 1) : lines.length;
  const fade = phase === "fade" && fadeMs ? (elapsed - logEnd) / fadeMs : 0;

  return (
    <div className={`boot ${reducedMotion ? "is-static" : ""}`} style={{ opacity: 1 - fade }}>
      <div className="boot-screen">
        {phase === "log" || phase === "fade" ? (
          <div aria-hidden="true" className="boot-log">
            {lines.slice(0, visibleLines).map((line, index) => (
              <p key={index} className="boot-line">
                {line.startsWith("[  OK  ]") ? (
                  <>
                    [<span className="boot-ok">{"  OK  "}</span>]{line.slice(8)}
                  </>
                ) : (
                  line || " "
                )}
              </p>
            ))}
            <span className="boot-cursor" />
          </div>
        ) : null}
      </div>
      <div aria-hidden="true" className="boot-scanlines" />
    </div>
  );
}

export default BootSequence;
