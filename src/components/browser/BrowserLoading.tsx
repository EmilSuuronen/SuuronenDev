type BrowserLoadingProps = {
  attemptedUrl: string;
};

function BrowserLoading({ attemptedUrl }: BrowserLoadingProps) {
  return (
    <div className="browser-unavailable browser-unavailable--loading">
      <div className="browser-loading-spinner" aria-hidden="true" />
      <div className="browser-unavailable-copy">
        <span className="browser-eyebrow">Loading page</span>
        <h2>Trying to open this site inside the browser window.</h2>
        <p className="browser-description">
          If the page does not support iframe embedding, this browser will fall back to a local unavailable page.
        </p>
        <div className="browser-unavailable-url">{attemptedUrl}</div>
      </div>
    </div>
  );
}

export default BrowserLoading;
