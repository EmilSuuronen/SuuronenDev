import { FileText, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

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
  const [query, setQuery] = useState("");

  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return notes;
    }

    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(normalizedQuery) ||
        note.content.toLowerCase().includes(normalizedQuery),
    );
  }, [notes, query]);

  const wordCount = activeNote
    ? activeNote.content
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    : 0;
  const characterCount = activeNote?.content.length ?? 0;
  const lineCount = activeNote ? activeNote.content.split("\n").length : 0;

  return (
    <div className="notes-app">
      <aside className="notes-sidebar">
        <div className="notes-sidebar-header">
          <div>
            <span className="notes-kicker">{t("Notes")}</span>
            <h2>{t("Desktop notes")}</h2>
          </div>
          <button className="notes-action-button" type="button" onClick={onCreateNote}>
            <Plus className="notes-action-icon" />
            <span>{t("New note")}</span>
          </button>
        </div>

        <label className="notes-search">
          <Search className="notes-search-icon" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("Search notes")}
          />
        </label>

        <div className="notes-list" role="list">
          {filteredNotes.length === 0 ? (
            <div className="notes-empty-list">{t("No notes yet. Create one to start writing.")}</div>
          ) : (
            filteredNotes.map((note) => (
              <button
                key={note.id}
                className={`notes-list-item${activeNote?.id === note.id ? " is-active" : ""}`}
                type="button"
                onClick={() => onOpenNote(note.id)}
              >
                <span className="notes-list-item-icon" aria-hidden="true">
                  <FileText className="notes-file-icon" />
                </span>
                <span className="notes-list-item-text">
                  <strong>{note.title}</strong>
                  <span>{new Date(note.updatedAt).toLocaleString()}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </aside>

      <section className="notes-editor-shell">
        {activeNote ? (
          <>
            <div className="notes-editor-toolbar">
              <input
                className="notes-title-input"
                type="text"
                value={activeNote.title}
                onChange={(event) => onRenameNote(activeNote.id, event.target.value)}
              />

              <div className="notes-editor-toolbar-actions">
                <span className="notes-save-indicator">{t("Autosaved to desktop")}</span>
                <button
                  className="notes-delete-button"
                  type="button"
                  onClick={() => onDeleteNote(activeNote.id)}
                >
                  <Trash2 className="notes-delete-icon" />
                  <span>{t("Delete")}</span>
                </button>
              </div>
            </div>

            <textarea
              className="notes-editor"
              value={activeNote.content}
              onChange={(event) => onUpdateNoteContent(activeNote.id, event.target.value)}
              placeholder={t("Start typing your note here...")}
            />

            <div className="notes-statusbar">
              <span>{t("Words")}: {wordCount}</span>
              <span>{t("Characters")}: {characterCount}</span>
              <span>{t("Lines")}: {lineCount}</span>
            </div>
          </>
        ) : (
          <div className="notes-editor-empty">
            <FileText className="notes-empty-icon" />
            <h3>{t("No note selected")}</h3>
            <p>{t("Create a .txt file and it will appear on the desktop automatically.")}</p>
            <button className="notes-action-button" type="button" onClick={onCreateNote}>
              <Plus className="notes-action-icon" />
              <span>{t("Create first note")}</span>
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default NotesApp;
