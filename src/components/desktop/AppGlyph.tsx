import type { WindowId } from "../../types/desktop";

type AppGlyphProps = {
  appId: WindowId;
  className?: string;
};

function AppGlyph({ appId, className = "" }: AppGlyphProps) {
  if (appId === "browser") {
    return (
      <span className={`app-glyph app-glyph--globe ${className}`.trim()} aria-hidden="true">
        <span className="app-glyph-globe">
          <span className="app-glyph-globe-ring app-glyph-globe-ring--vertical" />
          <span className="app-glyph-globe-ring app-glyph-globe-ring--horizontal" />
        </span>
      </span>
    );
  }

  if (appId === "calculator") {
    return (
      <span className={`app-glyph app-glyph--calculator ${className}`.trim()} aria-hidden="true">
        <span className="app-glyph-calculator">
          <span className="app-glyph-calculator-screen" />
          <span className="app-glyph-calculator-keys">
            <span />
            <span />
            <span />
            <span />
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className={`app-glyph app-glyph--terminal ${className}`.trim()} aria-hidden="true">
      <span className="app-glyph-text">{">_"}</span>
    </span>
  );
}

export default AppGlyph;
