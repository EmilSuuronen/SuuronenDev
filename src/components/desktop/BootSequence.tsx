import { useEffect, useRef, useState } from "react";

import { desktopLaunchers } from "../../data/desktop";
import { useLocale } from "../../i18n/locale";

export type SessionMode = "desktop" | "text";

type BootSequenceProps = {
  // "desktop" skips straight to the load screen (used by text mode's "boot desktop").
  entry: "full" | "desktop";
  initialChoice: SessionMode;
  onChoose: (mode: SessionMode) => void;
  onDone: () => void;
  themeId: string;
};

// Power-on and log take 1.45s; after a choice the desktop is up 1.15s later, text mode 0.3s later.
const CRT_END = 400;
const LOG_END = 1450;
const LOAD_MS = 850;
const FADE_MS = 300;
// Like GRUB: boot the highlighted entry unless the visitor touches the menu.
const AUTO_BOOT_MS = 10000;

const MENU_OPTIONS: { detail: string; id: SessionMode; name: string }[] = [
  { id: "desktop", name: "Desktop", detail: "full experience: windows, apps, terminal, games" },
  { id: "text", name: "Text mode", detail: "one page: about, projects, contact" },
];

function getBootLines(themeId: string) {
  return [
    "SUURONEN BIOS v1.0.0  (c) 2026 Emil Suuronen",
    "CPU: Human Brain @ 3 coffees/hour",
    "Memory test: 16384K OK",
    "Detecting drives... /dev/portfolio",
    "",
    "Booting suuronen.dev (linux-ish 6.18-desktop)",
    "[  OK  ] Mounted /home/emil",
    "[  OK  ] Started window manager",
    "[  OK  ] Started compositor (candy blobs)",
    ...desktopLaunchers.map((launcher) => `[  OK  ] Started ${launcher.id}.service: ${launcher.label}`),
    "[  OK  ] Started antgame.service: Ant Exterminator",
    `[  OK  ] Loaded theme ${themeId}`,
    "[  OK  ] Reached target Coffee",
    "[  OK  ] Reached target Portfolio",
    "",
    "Starting boot manager...",
  ];
}

function BootSequence({ entry, initialChoice, onChoose, onDone, themeId }: BootSequenceProps) {
  const { t } = useLocale();
  const [reducedMotion] = useState(() => Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches));
  const startRef = useRef(performance.now());
  const [elapsed, setElapsed] = useState(0);
  const [choice, setChoice] = useState<{ at: number; mode: SessionMode } | null>(
    entry === "desktop" ? { at: 0, mode: "desktop" } : null,
  );
  const [selected, setSelected] = useState<SessionMode>(initialChoice);
  const [autoBoot, setAutoBoot] = useState(true);
  const optionRefs = useRef<Partial<Record<SessionMode, HTMLButtonElement | null>>>({});
  const crtEnd = reducedMotion ? 0 : CRT_END;
  const logEnd = reducedMotion ? 0 : LOG_END;
  const loadMs = reducedMotion ? 0 : LOAD_MS;
  const fadeMs = reducedMotion ? 0 : FADE_MS;

  const sinceChoice = choice ? elapsed - choice.at : 0;
  const phase = choice
    ? choice.mode === "desktop" && sinceChoice < loadMs
      ? "load"
      : sinceChoice < (choice.mode === "desktop" ? loadMs : 0) + fadeMs
        ? "fade"
        : "done"
    : elapsed < crtEnd
      ? "crt"
      : elapsed < logEnd
        ? "log"
        : "menu";

  const choose = (mode: SessionMode) => {
    if (choice) {
      return;
    }

    setChoice({ at: performance.now() - startRef.current, mode });
    onChoose(mode);
  };

  useEffect(() => {
    if (entry === "desktop") {
      onChoose("desktop");
    }
    // Only on mount: the desktop starts loading underneath the load screen.
  }, []);

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
    } else if (phase === "menu" && autoBoot && elapsed >= logEnd + AUTO_BOOT_MS) {
      choose(selected);
    }
  });

  // Skipping only fast-forwards the animations; the choice itself always waits for the menu.
  useEffect(() => {
    const skip = () => {
      const now = performance.now();

      if (phase === "crt" || phase === "log") {
        startRef.current = now - logEnd;
      } else if (phase === "load" && choice) {
        setChoice({ ...choice, at: now - startRef.current - loadMs });
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (phase !== "menu") {
        skip();
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const index = MENU_OPTIONS.findIndex((option) => option.id === selected);
        const step = event.key === "ArrowDown" ? 1 : -1;
        setSelected(MENU_OPTIONS[(index + step + MENU_OPTIONS.length) % MENU_OPTIONS.length].id);
        setAutoBoot(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", skip);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", skip);
    };
  }, [choice, loadMs, logEnd, phase, selected]);

  useEffect(() => {
    if (phase === "menu") {
      optionRefs.current[selected]?.focus();
    }
  }, [phase, selected]);

  const lines = getBootLines(themeId);
  const lineDuration = (logEnd - crtEnd) / lines.length;
  const visibleLines = Math.min(lines.length, Math.floor((elapsed - crtEnd) / lineDuration) + 1);
  const loadProgress = loadMs ? Math.min(1, Math.max(0, sinceChoice / (loadMs - 120))) : 1;
  const fade = phase === "fade" && fadeMs ? (sinceChoice - (choice?.mode === "desktop" ? loadMs : 0)) / fadeMs : 0;
  const secondsLeft = Math.max(0, Math.ceil((logEnd + AUTO_BOOT_MS - elapsed) / 1000));
  const showLoader = phase === "load" || (phase === "fade" && choice?.mode === "desktop");

  return (
    <div className={`boot ${reducedMotion ? "is-static" : ""}`} style={{ opacity: 1 - fade }}>
      <div className="boot-screen">
        {phase === "log" ? (
          <div aria-hidden="true" className="boot-log">
            {lines.slice(0, visibleLines).map((line, index) => (
              <p key={index} className="boot-line">
                {line.startsWith("[  OK  ]") ? (
                  <>
                    [<span className="boot-ok">{"  OK  "}</span>]{line.slice(8)}
                  </>
                ) : (
                  line || " "
                )}
              </p>
            ))}
            <span className="boot-cursor" />
          </div>
        ) : null}

        {phase === "menu" || (phase === "fade" && choice?.mode === "text") ? (
          <div aria-labelledby="boot-menu-title" aria-modal="true" className="boot-menu" role="dialog">
            <p className="boot-menu-title" id="boot-menu-title">
              suuronen.dev {t("boot manager")}
            </p>
            <div className="boot-menu-box">
              {MENU_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  ref={(element) => {
                    optionRefs.current[option.id] = element;
                  }}
                  className={`boot-menu-item ${selected === option.id ? "is-selected" : ""}`}
                  onClick={() => choose(option.id)}
                  onFocus={() => setSelected(option.id)}
                  onPointerEnter={() => {
                    setSelected(option.id);
                    setAutoBoot(false);
                  }}
                  type="button"
                >
                  <span aria-hidden="true" className="boot-menu-marker">
                    {selected === option.id ? ">" : " "}
                  </span>
                  <span className="boot-menu-name">{t(option.name)}</span>
                  <span className="boot-menu-detail">{t(option.detail)}</span>
                </button>
              ))}
            </div>
            <p className="boot-menu-hint">{t("↑ ↓ to select · Enter to boot · or click")}</p>
            <p className="boot-menu-hint" aria-live="off">
              {autoBoot && !choice
                ? `${t(MENU_OPTIONS.find((option) => option.id === selected)!.name)} ${t("starts in")} ${secondsLeft}s`
                : " "}
            </p>
          </div>
        ) : null}

        {showLoader ? (
          <div aria-label={t("Starting desktop…")} className="boot-loader" role="status">
            <span aria-hidden="true" className="boot-logo">
              <span />
              <span />
              <span />
              <span />
            </span>
            <strong className="boot-title">suuronen.dev</strong>
            <span aria-hidden="true" className="boot-progress">
              {/* Ease-out so the bar rushes, then settles, like a real loader. */}
              <span style={{ transform: `scaleX(${1 - (1 - loadProgress) ** 2})` }} />
            </span>
            <span className="boot-status">{loadProgress < 1 ? t("Starting desktop…") : t("Welcome")}</span>
          </div>
        ) : null}
      </div>
      <div aria-hidden="true" className="boot-scanlines" />
    </div>
  );
}

export default BootSequence;
