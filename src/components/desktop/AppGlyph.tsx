import { Calculator, CodeXml, FileText, FolderClosed, Globe2, NotebookPen, ScanFace, Settings2, Trash2 } from "lucide-react";
import discisIcon from "../../res/discis-192.png";
import molkkisIcon from "../../res/icon-192.png";
import poplioIcon from "../../res/poplio-192.png";
import type { DesktopIconKey } from "../../types/desktop";

// Projects that live on their own sites wear their own app icon.
const projectIcons: Partial<Record<DesktopIconKey, string>> = {
  discis: discisIcon,
  molkkis: molkkisIcon,
  poplio: poplioIcon,
};

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

  const projectIcon = projectIcons[iconKey];
  if (projectIcon) {
    return (
      <span className={`app-glyph app-glyph--${iconKey} ${className}`.trim()} aria-hidden="true">
        <img className="app-glyph-molkkis-image" src={projectIcon} alt="" />
      </span>
    );
  }

  if (iconKey === "ar") {
    return (
      <span className={`app-glyph app-glyph--ar ${className}`.trim()} aria-hidden="true">
        <ScanFace className="app-glyph-ar" strokeWidth={1.75} />
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

  if (iconKey === "antgame") {
    return (
      <span className={`app-glyph app-glyph--antgame ${className}`.trim()} aria-hidden="true">
        <span className="app-glyph-antgame-pixel" />
      </span>
    );
  }

  if (iconKey === "code") {
    return (
      <span className={`app-glyph app-glyph--code ${className}`.trim()} aria-hidden="true">
        <CodeXml className="app-glyph-code" strokeWidth={1.75} />
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
      <span className={`app-glyph app-glyph--browser ${className}`.trim()} aria-hidden="true">
        <Globe2 className="app-glyph-browser" strokeWidth={1.75} />
      </span>
    );
  }

  if (iconKey === "calculator") {
    return (
      <span className={`app-glyph app-glyph--calculator ${className}`.trim()} aria-hidden="true">
        <Calculator className="app-glyph-calculator" strokeWidth={1.75} />
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
