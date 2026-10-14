import { useEffect, useRef, useState } from "react";

import { desktopLaunchers } from "../../data/desktop";
import { useLocale } from "../../i18n/locale";

type BootSequenceProps = {
  onDone: () => void;
  themeId: string;
};

// Under 3 seconds on screen, with headroom for the desktop's own startup work delaying frames:
// CRT power-on, boot log, load screen, fade.
const CRT_END = 400;
const LOG_END = 1450;
const LOAD_END = 2300;
const FADE_END = 2600;

export const BOOT_STORAGE_KEY = "suuronen.desktop.booted";

export function shouldPlayBoot() {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    return false;
  }

  try {
    return window.sessionStorage.getItem(BOOT_STORAGE_KEY) !== "1";
  } catch {
    return true;
  }
}

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
    "Starting suuronen.dev desktop...",
  ];
}

function BootSequence({ onDone, themeId }: BootSequenceProps) {
  const { t } = useLocale();
  const startRef = useRef(performance.now());
  const [elapsed, setElapsed] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let frame = 0;
    const tick = (now: number) => {
      const time = now - startRef.current;
      setElapsed(time);

      if (time >= FADE_END) {
        onDoneRef.current();
        return;
      }

      frame = requestAnimationFrame(tick);
    };
    // Any key or click jumps straight to the fade.
    const skip = () => {
      startRef.current = Math.min(startRef.current, performance.now() - LOAD_END);
    };

    frame = requestAnimationFrame(tick);
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, []);

  const lines = getBootLines(themeId);
  const lineDuration = (LOG_END - CRT_END) / lines.length;
  const visibleLines = Math.min(lines.length, Math.floor((elapsed - CRT_END) / lineDuration) + 1);
  const loadProgress = Math.min(1, Math.max(0, (elapsed - LOG_END) / (LOAD_END - LOG_END - 120)));
  const isLoading = elapsed >= LOG_END;
  const fade = elapsed > LOAD_END ? Math.min(1, (elapsed - LOAD_END) / (FADE_END - LOAD_END)) : 0;

  return (
    <div aria-hidden="true" className="boot" style={{ opacity: 1 - fade }}>
      <div className="boot-screen">
        {!isLoading && elapsed >= CRT_END ? (
          <div className="boot-log">
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

        {isLoading ? (
          <div className="boot-loader">
            <span className="boot-logo">
              <span />
              <span />
              <span />
              <span />
            </span>
            <strong className="boot-title">suuronen.dev</strong>
            <span className="boot-progress">
              {/* Ease-out so the bar rushes, then settles, like a real loader. */}
              <span style={{ transform: `scaleX(${1 - (1 - loadProgress) ** 2})` }} />
            </span>
            <span className="boot-status">{loadProgress < 1 ? t("Starting desktop…") : t("Welcome")}</span>
          </div>
        ) : null}
      </div>
      <div className="boot-scanlines" />
    </div>
  );
}

export default BootSequence;
