import { Check, FileText, Plus } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useLocale } from "../i18n/locale";
import type { NoteFile } from "../types/desktop";

type NotesAppProps = {
  activeNote: NoteFile | null;
  notes: NoteFile[];
  onCreateNote: () => void;
  onDeleteNote: (noteId: NoteFile["id"]) => void;
  onOpenNote: (noteId: NoteFile["id"]) => void;
  onRenameNote: (noteId: NoteFile["id"], title: string) => void;
  onUpdateNoteContent: (noteId: NoteFile["id"], content: string) => void;
};

type MenuItem = { checked?: boolean; disabled?: boolean; label: string; onSelect: () => void; shortcut?: string };

const ZOOM_STEPS = [50, 70, 80, 90, 100, 110, 125, 150, 175, 200];

// Notepad-style editor: a tab per note, a File/Edit/View menu bar, plain text, and a status bar.
function NotesApp({
  activeNote,
  notes,
  onCreateNote,
  onDeleteNote,
  onOpenNote,
  onRenameNote,
  onUpdateNoteContent,
}: NotesAppProps) {
  const { t } = useLocale();
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const menuBarRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<NoteFile["id"] | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [cursor, setCursor] = useState({ column: 1, line: 1 });
  const [zoom, setZoom] = useState(100);
  const [wordWrap, setWordWrap] = useState(true);
  const [showStatusBar, setShowStatusBar] = useState(true);

  // Creation order keeps tabs still while typing (the list itself is sorted by last edit).
  const tabs = useMemo(() => [...notes].sort((left, right) => left.createdAt.localeCompare(right.createdAt)), [notes]);

  useEffect(() => {
    if (!openMenu) {
      return undefined;
    }

    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !menuBarRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", close);
    };
  }, [openMenu]);

  useEffect(() => {
    setCursor({ column: 1, line: 1 });
    setRenamingId(null);
  }, [activeNote?.id]);

  const updateCursor = () => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    const before = editor.value.slice(0, editor.selectionStart);
    const lines = before.split("\n");
    setCursor({ column: lines[lines.length - 1].length + 1, line: lines.length });
  };

  const startRename = (note: NoteFile) => {
    setRenamingId(note.id);
    setTitleDraft(note.title);
  };

  const commitRename = () => {
    const note = notes.find((item) => item.id === renamingId);

    if (note && titleDraft.trim() && titleDraft !== note.title) {
      onRenameNote(note.id, titleDraft);
    }

    setRenamingId(null);
  };

  const insertTimeDate = () => {
    const editor = editorRef.current;

    if (!editor || !activeNote) {
      return;
    }

    const stamp = new Date().toLocaleString([], { dateStyle: "short", timeStyle: "short" });
    const { selectionEnd, selectionStart, value } = editor;
    onUpdateNoteContent(activeNote.id, value.slice(0, selectionStart) + stamp + value.slice(selectionEnd));
    requestAnimationFrame(() => {
      editor.focus();
      editor.setSelectionRange(selectionStart + stamp.length, selectionStart + stamp.length);
      updateCursor();
    });
  };

  const stepZoom = (direction: 1 | -1) => {
    const index = ZOOM_STEPS.indexOf(zoom);
    setZoom(ZOOM_STEPS[Math.min(ZOOM_STEPS.length - 1, Math.max(0, index + direction))]);
  };

  const menus: { items: MenuItem[]; label: string }[] = [
    {
      label: "File",
      items: [
        { label: "New note", onSelect: onCreateNote },
        { disabled: !activeNote, label: "Rename", onSelect: () => activeNote && startRename(activeNote) },
        { disabled: !activeNote, label: "Move to Trash", onSelect: () => activeNote && onDeleteNote(activeNote.id) },
      ],
    },
    {
      label: "Edit",
      items: [
        { disabled: !activeNote, label: "Time/Date", onSelect: insertTimeDate, shortcut: "F5" },
        {
          disabled: !activeNote,
          label: "Select all",
          onSelect: () => {
            editorRef.current?.focus();
            editorRef.current?.select();
          },
          shortcut: "Ctrl+A",
        },
      ],
    },
    {
      label: "View",
      items: [
        { label: "Zoom in", onSelect: () => stepZoom(1) },
        { label: "Zoom out", onSelect: () => stepZoom(-1) },
        { label: "Restore default zoom", onSelect: () => setZoom(100) },
        { checked: wordWrap, label: "Word wrap", onSelect: () => setWordWrap(!wordWrap) },
        { checked: showStatusBar, label: "Status bar", onSelect: () => setShowStatusBar(!showStatusBar) },
      ],
    },
  ];

  return (
    <div className="notepad">
      <div className="notepad-tabs" role="tablist" aria-label={t("Notes")}>
        {tabs.map((note) => (
          <div
            key={note.id}
            aria-selected={activeNote?.id === note.id}
            className={`notepad-tab${activeNote?.id === note.id ? " is-active" : ""}`}
            onClick={() => onOpenNote(note.id)}
            onDoubleClick={() => startRename(note)}
            role="tab"
            title={`${note.title} · ${t("Double-click to rename")}`}
          >
            <FileText aria-hidden="true" className="notepad-tab-icon" />
            {renamingId === note.id ? (
              <input
                aria-label={t("Rename note")}
                autoFocus
                className="notepad-tab-rename"
                onBlur={commitRename}
                onChange={(event) => setTitleDraft(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    commitRename();
                  } else if (event.key === "Escape") {
                    setRenamingId(null);
                  }
                }}
                value={titleDraft}
              />
            ) : (
              <span className="notepad-tab-title">{note.title}</span>
            )}
          </div>
        ))}
        <button aria-label={t("New note")} className="notepad-new-tab" onClick={onCreateNote} title={t("New note")} type="button">
          <Plus aria-hidden="true" />
        </button>
      </div>

      <div ref={menuBarRef} className="notepad-menubar" role="menubar">
        {menus.map((menu) => (
          <div key={menu.label} className="notepad-menu">
            <button
              aria-expanded={openMenu === menu.label}
              aria-haspopup="menu"
              className={`notepad-menu-trigger${openMenu === menu.label ? " is-open" : ""}`}
              onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
              onPointerEnter={() => openMenu && setOpenMenu(menu.label)}
              role="menuitem"
              type="button"
            >
              {t(menu.label)}
            </button>
            {openMenu === menu.label ? (
              <div className="notepad-menu-panel" role="menu">
                {menu.items.map((item) => (
                  <button
                    key={item.label}
                    className="notepad-menu-item"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpenMenu(null);
                      item.onSelect();
                    }}
                    role={item.checked === undefined ? "menuitem" : "menuitemcheckbox"}
                    aria-checked={item.checked}
                    type="button"
                  >
                    <span className="notepad-menu-check" aria-hidden="true">
                      {item.checked ? <Check /> : null}
                    </span>
                    <span>{t(item.label)}</span>
                    {item.shortcut ? <kbd>{item.shortcut}</kbd> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {activeNote ? (
        <textarea
          ref={editorRef}
          aria-label={activeNote.title}
          className={`notepad-editor${wordWrap ? "" : " is-nowrap"}`}
          onChange={(event) => {
            onUpdateNoteContent(activeNote.id, event.target.value);
            updateCursor();
          }}
          onClick={updateCursor}
          onKeyDown={(event) => {
            if (event.key === "F5") {
              event.preventDefault();
              insertTimeDate();
            }
          }}
          onKeyUp={updateCursor}
          spellCheck={false}
          style={{ fontSize: `${(15 * zoom) / 100}px` }}
          value={activeNote.content}
          wrap={wordWrap ? "soft" : "off"}
        />
      ) : (
        <div className="notepad-empty">
          <p>{t("No notes yet.")}</p>
          <button className="notepad-empty-button" onClick={onCreateNote} type="button">
            <Plus aria-hidden="true" />
            {t("New note")}
          </button>
        </div>
      )}

      {showStatusBar ? (
        <div className="notepad-statusbar">
          <span>
            {t("Ln")} {cursor.line}, {t("Col")} {cursor.column}
          </span>
          <span>
            {activeNote?.content.length ?? 0} {t("characters")}
          </span>
          <span>{zoom}%</span>
          <span>UTF-8</span>
        </div>
      ) : null}
    </div>
  );
}

export default NotesApp;
