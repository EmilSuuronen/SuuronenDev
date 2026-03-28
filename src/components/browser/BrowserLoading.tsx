import { useLocale } from "../../i18n/locale";

type BrowserLoadingProps = {
  attemptedUrl: string;
};

function BrowserLoading({ attemptedUrl }: BrowserLoadingProps) {
  const { t } = useLocale();
  return (
    <div className="browser-unavailable browser-unavailable--loading">
      <div className="browser-loading-spinner" aria-hidden="true" />
      <div className="browser-unavailable-copy">
        <span className="browser-eyebrow">{t("Loading page")}</span>
        <h2>{t("Trying to open this site inside the browser window.")}</h2>
        <p className="browser-description">
          {t("If the page does not support iframe embedding, this browser will fall back to a local unavailable page.")}
        </p>
        <div className="browser-unavailable-url">{attemptedUrl}</div>
      </div>
    </div>
  );
}

export default BrowserLoading;
