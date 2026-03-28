import { FolderClosed } from "lucide-react";
import molkkisIcon from "../../res/icon-192.png";
import type { DesktopIconKey } from "../../types/desktop";

type AppGlyphProps = {
  iconKey: DesktopIconKey;
  className?: string;
};

function AppGlyph({ iconKey, className = "" }: AppGlyphProps) {
  if (iconKey === "folder") {
    return (
      <span className={`app-glyph app-glyph--folder ${className}`.trim()} aria-hidden="true">
        <FolderClosed className="app-glyph-folder" strokeWidth={1.7} />
      </span>
    );
  }

  if (iconKey === "molkkis") {
    return (
      <span className={`app-glyph app-glyph--molkkis ${className}`.trim()} aria-hidden="true">
        <img className="app-glyph-molkkis-image" src={molkkisIcon} alt="" />
      </span>
    );
  }

  if (iconKey === "browser") {
    return (
      <span className={`app-glyph app-glyph--globe ${className}`.trim()} aria-hidden="true">
        <span className="app-glyph-globe">
          <span className="app-glyph-globe-ring app-glyph-globe-ring--vertical" />
          <span className="app-glyph-globe-ring app-glyph-globe-ring--horizontal" />
        </span>
      </span>
    );
  }

  if (iconKey === "calculator") {
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
