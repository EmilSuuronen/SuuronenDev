import { useLocale } from "../../i18n/locale";

type BrowserUnavailableProps = {
  attemptedUrl: string;
};

function BrowserUnavailable({ attemptedUrl }: BrowserUnavailableProps) {
  const { t } = useLocale();
  return (
    <div className="browser-unavailable">
      <div className="browser-unavailable-icon" aria-hidden="true">
        !
      </div>
      <div className="browser-unavailable-copy">
        <span className="browser-eyebrow">{t("Page not available")}</span>
        <h2>{t("This page could not be displayed inside the browser window.")}</h2>
        <p className="browser-description">
          {t(
            "Some websites block iframe embedding or use security policies that prevent this in-browser desktop from rendering them.",
          )}
        </p>
        <div className="browser-unavailable-url">{attemptedUrl}</div>
      </div>
      <div className="browser-unavailable-actions">
        <a className="browser-unavailable-action is-primary" href={attemptedUrl} target="_blank" rel="noreferrer">
          {t("Open in new tab")}
        </a>
      </div>
    </div>
  );
}

export default BrowserUnavailable;
