import AppGlyph from "../components/desktop/AppGlyph";
import type { DesktopEntryId, DesktopIconState } from "../types/desktop";

type FolderAppProps = {
  entries: DesktopIconState[];
  onOpenEntry: (entryId: DesktopEntryId) => void;
};

function FolderApp({ entries, onOpenEntry }: FolderAppProps) {
  return (
    <div className="folder-app">
      {entries.length === 0 ? (
        <div className="folder-empty-state">This folder is empty.</div>
      ) : (
        <div className="folder-grid" role="list">
          {entries.map((entry) => (
            <button
              key={entry.id}
              className="folder-item"
              type="button"
              onDoubleClick={() => onOpenEntry(entry.id)}
            >
              <span className="folder-item-art" aria-hidden="true">
                <AppGlyph iconKey={entry.icon} className="folder-item-glyph" />
              </span>
              <span className="folder-item-label">{entry.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default FolderApp;
