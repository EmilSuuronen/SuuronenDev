import { useEffect, useMemo, useState } from "react";

import type { DesktopFileId, NoteFile } from "../types/desktop";

const STORAGE_KEY = "suuronen.desktop.notes";

function sanitizeTitle(value: string) {
  const trimmed = value.trim().replace(/[\\/:*?"<>|]/g, "");
  const withExtension = trimmed.toLowerCase().endsWith(".txt") ? trimmed : `${trimmed || "untitled"}.txt`;
  return withExtension.slice(0, 48);
}

function createNoteId() {
  return `note:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}` as DesktopFileId;
}

export function useNotes() {
  const [notes, setNotes] = useState<NoteFile[]>(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        return [];
      }

      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) ? (parsed as NoteFile[]) : [];
    } catch {
      return [];
    }
  });
  const [activeNoteId, setActiveNoteId] = useState<DesktopFileId | null>(null);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    if (!activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0].id);
      return;
    }

    if (activeNoteId && !notes.some((note) => note.id === activeNoteId)) {
      setActiveNoteId(notes[0]?.id ?? null);
    }
  }, [activeNoteId, notes]);

  const notesByUpdated = useMemo(
    () =>
      [...notes].sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    [notes],
  );
  const visibleNotes = useMemo(
    () => notesByUpdated.filter((note) => !note.trashedAt),
    [notesByUpdated],
  );

  const activeNote = notes.find((note) => note.id === activeNoteId) ?? null;

  return {
    activeNote,
    activeNoteId,
    createNote: (preferredTitle?: string) => {
      const now = new Date().toISOString();
      const note: NoteFile = {
        id: createNoteId(),
        title: sanitizeTitle(preferredTitle ?? `note-${notes.length + 1}.txt`),
        content: "",
        createdAt: now,
        updatedAt: now,
      };

      setNotes((currentNotes) => [note, ...currentNotes]);
      setActiveNoteId(note.id);
      return note;
    },
    deleteNote: (noteId: DesktopFileId) => {
      const timestamp = new Date().toISOString();
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === noteId
            ? {
                ...note,
                trashedAt: timestamp,
                updatedAt: timestamp,
              }
            : note,
        ),
      );
      setActiveNoteId((currentActiveId) => {
        if (currentActiveId !== noteId) {
          return currentActiveId;
        }

        return visibleNotes.find((note) => note.id !== noteId)?.id ?? null;
      });
    },
    notes: visibleNotes,
    allNotes: notesByUpdated,
    openNote: (noteId: DesktopFileId) => {
      setActiveNoteId(noteId);
    },
    renameNote: (noteId: DesktopFileId, nextTitle: string) => {
      const timestamp = new Date().toISOString();
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === noteId
            ? {
                ...note,
                title: sanitizeTitle(nextTitle),
                trashedAt: note.trashedAt ?? null,
                updatedAt: timestamp,
              }
            : note,
        ),
      );
    },
    updateNoteContent: (noteId: DesktopFileId, content: string) => {
      const timestamp = new Date().toISOString();
      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.id === noteId
            ? {
                ...note,
                content,
                trashedAt: note.trashedAt ?? null,
                updatedAt: timestamp,
              }
            : note,
        ),
      );
    },
  };
}
