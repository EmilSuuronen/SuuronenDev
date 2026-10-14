import { Code2, Languages, Palette, Search, Sparkles, SquareTerminal, Zap } from "lucide-react";
import { useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";

import { useLocale } from "../../i18n/locale";
import AppGlyph from "./AppGlyph";
import { rankPaletteItems, type PaletteGroup, type PaletteItem } from "./paletteItems";

type CommandPaletteProps = {
  items: PaletteItem[];
  onClose: () => void;
  onSearchSource: (query: string) => void;
};

const GROUP_ICONS: Partial<Record<PaletteGroup, typeof Zap>> = {
  Action: Zap,
  Command: SquareTerminal,
  Effect: Sparkles,
  Language: Languages,
  Source: Code2,
  Theme: Palette,
};

function CommandPalette({ items, onClose, onSearchSource }: CommandPaletteProps) {
  const { t } = useLocale();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const results = useMemo(() => {
    const ranked = rankPaletteItems(items, query);
    const needle = query.trim();

    // Source files live in the Source Code app's lazy chunk, so they are searched there instead.
    return needle
      ? [
          ...ranked,
          {
            group: "Source" as const,
            id: "source-search",
            label: `${t("Search source code for")} "${needle}"`,
            run: () => onSearchSource(needle),
          },
        ]
      : ranked;
  }, [items, onSearchSource, query, t]);

  const activeIndex = Math.min(selectedIndex, results.length - 1);

  const runItem = (item: PaletteItem) => {
    onClose();
    item.run();
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      const next = (activeIndex + step + results.length) % Math.max(results.length, 1);
      setSelectedIndex(next);
      document.getElementById(`palette-option-${next}`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter" && results[activeIndex]) {
      event.preventDefault();
      runItem(results[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className="palette-backdrop" onPointerDown={onClose}>
      <div
        aria-label={t("Command palette")}
        aria-modal="true"
        className="palette"
        onPointerDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <label className="palette-search">
          <Search aria-hidden="true" className="palette-search-icon" />
          <input
            aria-activedescendant={results.length ? `palette-option-${activeIndex}` : undefined}
            aria-autocomplete="list"
            aria-controls="palette-results"
            aria-expanded="true"
            autoFocus
            className="palette-input"
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={t("Search apps, notes, themes, commands…")}
            role="combobox"
            spellCheck={false}
            value={query}
          />
          <kbd className="palette-kbd">Esc</kbd>
        </label>

        <ul className="palette-results" id="palette-results" role="listbox">
          {results.map((item, index) => {
            const GroupIcon = GROUP_ICONS[item.group];

            return (
              <li
                key={item.id}
                aria-selected={index === activeIndex}
                className={`palette-item ${index === activeIndex ? "is-active" : ""}`}
                id={`palette-option-${index}`}
                onClick={() => runItem(item)}
                onPointerMove={() => setSelectedIndex(index)}
                role="option"
              >
                <span aria-hidden="true" className="palette-item-icon">
                  {item.icon ? (
                    <AppGlyph className="palette-item-glyph" iconKey={item.icon} />
                  ) : GroupIcon ? (
                    <GroupIcon className="palette-item-lucide" />
                  ) : null}
                </span>
                <span className="palette-item-text">
                  <span className="palette-item-label">{item.label}</span>
                  {item.detail ? <span className="palette-item-detail">{item.detail}</span> : null}
                </span>
                <span className="palette-item-group">{t(item.group)}</span>
              </li>
            );
          })}
          {results.length === 0 ? <li className="palette-empty">{t("No matches")}</li> : null}
        </ul>

        <div className="palette-footer">
          <span>
            <kbd className="palette-kbd">↑</kbd> <kbd className="palette-kbd">↓</kbd> {t("to move")}
          </span>
          <span>
            <kbd className="palette-kbd">Enter</kbd> {t("to open")}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
