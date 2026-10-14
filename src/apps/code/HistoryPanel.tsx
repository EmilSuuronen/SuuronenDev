import { ExternalLink, GitCommitHorizontal, RotateCw, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useLocale } from "../../i18n/locale";
import { fetchFileCommits, formatRelativeDate, REPO, type FileCommit } from "./gitHistory";

type HistoryPanelProps = {
  onClose: () => void;
  onSelect: (commits: FileCommit[], index: number | null) => void;
  path: string;
  selectedSha: string | null;
};

type LoadState = { status: "loading" } | { status: "error"; message: string } | { commits: FileCommit[]; status: "ready" };

function HistoryPanel({ onClose, onSelect, path, selectedSha }: HistoryPanelProps) {
  const { locale, t } = useLocale();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    setState({ status: "loading" });
    fetchFileCommits(path)
      .then((commits) => isCurrent && setState({ commits, status: "ready" }))
      .catch((error: Error) => isCurrent && setState({ message: error.message, status: "error" }));

    return () => {
      isCurrent = false;
    };
  }, [attempt, path]);

  const historyUrl = `https://github.com/${REPO}/commits/main/${path}`;
  const dateLocale = locale === "fi" ? "fi" : "en";

  return (
    <aside className="code-history" aria-label={t("Timeline")}>
      <div className="code-history-header">
        <span className="code-explorer-title">{t("Timeline")}</span>
        <button aria-label={t("Close")} className="code-tab-close" onClick={onClose} type="button">
          <X className="code-tab-close-icon" />
        </button>
      </div>

      {state.status === "loading" ? <p className="code-history-note">{t("Loading history from GitHub…")}</p> : null}

      {state.status === "error" ? (
        <div className="code-history-note">
          <p>{t(state.message)}.</p>
          <div className="code-history-actions">
            <button className="code-live-reset" onClick={() => setAttempt((count) => count + 1)} type="button">
              <RotateCw className="code-toolbar-icon" />
              <span>{t("Retry")}</span>
            </button>
            <a className="code-live-reset" href={historyUrl} rel="noopener noreferrer" target="_blank">
              <ExternalLink className="code-toolbar-icon" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      ) : null}

      {state.status === "ready" && state.commits.length === 0 ? (
        <p className="code-history-note">{t("No history on GitHub yet. This file is newer than the last push.")}</p>
      ) : null}

      {state.status === "ready" && state.commits.length > 0 ? (
        <ol className="code-history-list">
          <li>
            <button
              className={`code-history-item ${selectedSha === null ? "is-active" : ""}`}
              onClick={() => onSelect(state.commits, null)}
              type="button"
            >
              <GitCommitHorizontal className="code-tree-icon" />
              <span className="code-history-text">
                <strong>{t("Deployed version")}</strong>
                <small>{t("What this desktop is running")}</small>
              </span>
            </button>
          </li>
          {state.commits.map((commit, index) => (
            <li key={commit.sha}>
              <button
                className={`code-history-item ${selectedSha === commit.sha ? "is-active" : ""}`}
                onClick={() => onSelect(state.commits, index)}
                title={commit.message}
                type="button"
              >
                <GitCommitHorizontal className="code-tree-icon" />
                <span className="code-history-text">
                  <strong>{commit.message.split("\n")[0]}</strong>
                  <small>
                    {commit.author} · {formatRelativeDate(commit.date, Date.now(), dateLocale)} · {commit.sha.slice(0, 7)}
                  </small>
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : null}
    </aside>
  );
}

export default HistoryPanel;
