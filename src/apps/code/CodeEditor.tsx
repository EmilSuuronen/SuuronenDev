import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { unifiedMergeView } from "@codemirror/merge";
import { EditorSelection, EditorState, type Extension } from "@codemirror/state";
import { Decoration, EditorView, MatchDecorator, ViewPlugin, type DecorationSet, type ViewUpdate } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { basicSetup } from "codemirror";
import { useEffect, useRef } from "react";

import { IMPORT_PATH_PATTERN } from "./sourceIndex";

type CodeEditorProps = {
  content: string;
  // When set, the content is shown as a diff against this older version.
  diffOriginal?: string;
  // Changing this reloads the document; content changes alone don't, so typing isn't reset by the parent.
  documentKey: string;
  editable: boolean;
  jump: { line: number; nonce: number; path: string } | null;
  onCursorChange: (line: number, column: number) => void;
  onChange: (path: string, text: string) => void;
  onOpenImport: (specifier: string) => void;
  path: string;
};

const editorTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      backgroundColor: "var(--surface-dark)",
      color: "var(--text-light)",
      fontSize: "0.82rem",
    },
    ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.6" },
    ".cm-content": { caretColor: "var(--accent-strong)" },
    ".cm-gutters": {
      backgroundColor: "var(--surface-dark-strong)",
      color: "var(--text-light-soft)",
      borderRight: "1px solid var(--surface-dark-border)",
    },
    ".cm-activeLine": { backgroundColor: "rgba(255, 255, 255, 0.04)" },
    ".cm-activeLineGutter": { backgroundColor: "var(--accent-soft)", color: "var(--accent-strong)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "var(--accent-soft) !important",
    },
    ".cm-cursor": { borderLeftColor: "var(--accent-strong)" },
    ".cm-foldPlaceholder": { backgroundColor: "transparent", border: "none", color: "var(--accent-strong)" },
    ".cm-panels": { backgroundColor: "var(--surface-dark-strong)", color: "var(--text-light)" },
    ".cm-searchMatch": { backgroundColor: "rgba(255, 216, 77, 0.25)" },
    ".cm-import-link": { cursor: "pointer", textDecoration: "underline dotted" },
    ".cm-import-link:hover": { textDecoration: "underline solid" },
    ".cm-changedLine": { backgroundColor: "rgba(143, 224, 160, 0.1) !important" },
    ".cm-changedText": { background: "rgba(143, 224, 160, 0.3) !important" },
    ".cm-deletedChunk": { backgroundColor: "rgba(255, 107, 94, 0.12) !important" },
    ".cm-deletedChunk .cm-deletedText": { background: "rgba(255, 107, 94, 0.32) !important" },
    ".cm-changeGutter": { width: "3px", paddingLeft: "0" },
    ".cm-changedLineGutter": { background: "var(--candy-green)" },
    ".cm-deletedLineGutter": { background: "var(--candy-red)" },
    ".cm-collapsedLines": {
      padding: "0.3rem 1rem",
      background: "var(--surface-dark-strong)",
      color: "var(--text-light-soft)",
      fontFamily: "var(--font-ui)",
      fontSize: "0.75rem",
    },
    ".cm-collapsedLines:before, .cm-collapsedLines:after": { display: "none" },
  },
  { dark: true },
);

const highlightStyle = HighlightStyle.define([
  { tag: [tags.keyword, tags.controlKeyword, tags.moduleKeyword, tags.operatorKeyword], color: "var(--accent-strong)" },
  { tag: [tags.string, tags.special(tags.string)], color: "var(--candy-green)" },
  { tag: [tags.number, tags.bool, tags.null], color: "var(--candy-yellow)" },
  { tag: [tags.typeName, tags.className, tags.namespace], color: "var(--candy-lilac)" },
  { tag: [tags.function(tags.variableName), tags.function(tags.propertyName)], color: "var(--candy-blue)" },
  { tag: [tags.tagName, tags.angleBracket], color: "var(--candy-pink)" },
  { tag: [tags.attributeName, tags.propertyName], color: "var(--candy-peach)" },
  { tag: tags.comment, color: "var(--text-light-soft)", fontStyle: "italic" },
  { tag: tags.invalid, color: "var(--candy-red)" },
]);

const importLinkDecorator = new MatchDecorator({
  regexp: IMPORT_PATH_PATTERN,
  decoration: Decoration.mark({ class: "cm-import-link" }),
});

const importLinks = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = importLinkDecorator.createDeco(view);
    }

    update(update: ViewUpdate) {
      this.decorations = importLinkDecorator.updateDeco(update, this.decorations);
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

function getLanguage(path: string): Extension {
  if (path.endsWith(".css")) {
    return css();
  }

  if (/\.(tsx?|json)$/.test(path)) {
    return javascript({ jsx: path.endsWith(".tsx"), typescript: true });
  }

  return [];
}

function CodeEditor({ content, diffOriginal, documentKey, editable, jump, onChange, onCursorChange, onOpenImport, path }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const changeTimeoutRef = useRef<number | undefined>(undefined);
  const callbacksRef = useRef({ content, onChange, onCursorChange, onOpenImport });
  callbacksRef.current = { content, onChange, onCursorChange, onOpenImport };

  useEffect(() => {
    const view = new EditorView({ parent: containerRef.current! });
    viewRef.current = view;

    return () => {
      window.clearTimeout(changeTimeoutRef.current);
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    view.setState(
      EditorState.create({
        doc: callbacksRef.current.content,
        extensions: [
          basicSetup,
          EditorState.readOnly.of(!editable),
          getLanguage(path),
          editorTheme,
          syntaxHighlighting(highlightStyle),
          importLinks,
          diffOriginal === undefined
            ? []
            : unifiedMergeView({
                collapseUnchanged: { margin: 3, minSize: 6 },
                gutter: true,
                mergeControls: false,
                original: diffOriginal,
              }),
          EditorView.updateListener.of((update) => {
            if (update.selectionSet || update.docChanged) {
              const head = update.state.selection.main.head;
              const line = update.state.doc.lineAt(head);
              callbacksRef.current.onCursorChange(line.number, head - line.from + 1);
            }

            if (update.docChanged) {
              window.clearTimeout(changeTimeoutRef.current);
              changeTimeoutRef.current = window.setTimeout(
                () => callbacksRef.current.onChange(path, update.state.doc.toString()),
                120,
              );
            }
          }),
          EditorView.domEventHandlers({
            mousedown: (event, editorView) => {
              if (!(event.target as HTMLElement).closest(".cm-import-link")) {
                return false;
              }

              const position = editorView.posAtCoords({ x: event.clientX, y: event.clientY });

              if (position === null) {
                return false;
              }

              const line = editorView.state.doc.lineAt(position);
              const offset = position - line.from;
              const match = [...line.text.matchAll(IMPORT_PATH_PATTERN)].find(
                (candidate) => candidate.index <= offset && offset <= candidate.index + candidate[0].length,
              );

              if (!match) {
                return false;
              }

              event.preventDefault();
              callbacksRef.current.onOpenImport(match[0].slice(1, -1));
              return true;
            },
          }),
        ],
      }),
    );
    view.scrollDOM.scrollTop = 0;
    callbacksRef.current.onCursorChange(1, 1);
  }, [diffOriginal, documentKey, editable, path]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view || jump?.path !== path) {
      return;
    }

    const line = view.state.doc.line(Math.min(Math.max(jump.line, 1), view.state.doc.lines));
    view.dispatch({
      effects: EditorView.scrollIntoView(line.from, { y: "center" }),
      selection: EditorSelection.range(line.from, line.to),
    });
    view.focus();
  }, [jump, path]);

  return <div ref={containerRef} className="code-editor" />;
}

export default CodeEditor;
