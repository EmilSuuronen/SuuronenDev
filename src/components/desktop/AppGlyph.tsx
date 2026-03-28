import { FileText, FolderClosed, NotebookPen, Settings2, Trash2 } from "lucide-react";
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

  if (iconKey === "settings") {
    return (
      <span className={`app-glyph app-glyph--settings ${className}`.trim()} aria-hidden="true">
        <Settings2 className="app-glyph-settings" strokeWidth={1.75} />
      </span>
    );
  }

  if (iconKey === "notes") {
    return (
      <span className={`app-glyph app-glyph--notes ${className}`.trim()} aria-hidden="true">
        <NotebookPen className="app-glyph-notes" strokeWidth={1.75} />
      </span>
    );
  }

  if (iconKey === "textfile") {
    return (
      <span className={`app-glyph app-glyph--textfile ${className}`.trim()} aria-hidden="true">
        <FileText className="app-glyph-textfile" strokeWidth={1.75} />
      </span>
    );
  }

  if (iconKey === "trash") {
    return (
      <span className={`app-glyph app-glyph--trash ${className}`.trim()} aria-hidden="true">
        <Trash2 className="app-glyph-trash" strokeWidth={1.75} />
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
