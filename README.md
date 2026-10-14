# SuuronenDev

Personal site for [suuronen.dev](https://suuronen.dev), rebuilt as a React + TypeScript app with Vite

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Terminal

The terminal keeps the desktop's original appearance and runs a local, Ubuntu-inspired shell. Run `help` for commands or `man intro` for the full guide.

- Stateful paths and virtual files: `cd`, `ls -lah`, `find`, `tree`, `mkdir`, `touch`, `cp`, `mv`, `rm`, `nano`.
- Text pipelines: `cat`, `printf`, `grep`, `head`, `tail`, `wc`, `sort`, `uniq`, `cut`, `tr`, `base64` and more. Quoting, variables, aliases, globs, redirects, `&&`, `||`, and history expansion work together.
- Keyboard controls: Tab completion, Up/Down history, Ctrl+R search, Ctrl+C interrupt, Ctrl+L clear, and readline editing shortcuts. Multiline pastes are prepared for review and run only after Enter.
- Desktop integration: `apps`, `open calculator`, `open browser`, `open antgame`, `notes`, and read-only files under `~/Notes`. Open a note to edit it in the desktop Notes app.
- Discoveries: `fortune | cowsay`, `coffee`, `sl`, `apt moo`, `adventure`, and clues in hidden files.

Home files and up to 500 history entries persist in this browser under `suuronen.desktop.terminal.v1`. `/tmp`, aliases, and environment variables are session-local. `history -c` clears history; commands starting with a space are not recorded. Settings' existing data reset also clears terminal storage.

This is a browser sandbox, not a remote shell or native Ubuntu installation. It never executes host commands. System files are read-only; writes have file-count and byte limits. `man intro` documents supported syntax and limits, including the absence of native binaries, package installation, job control, and shell scripts.

## Source Code app

The Source Code app (`src/apps/code/`) is a viewer for this site's own source, bundled at build time with `import.meta.glob`, so it always shows exactly what is deployed. It loads lazily: CodeMirror and the source text download only when the app is opened.

- **Browse:** file tree, tabs, Ctrl+P fuzzy file search, and clickable import paths (relative and `@/`).
- **Inspect:** click Inspect, then anything on the desktop, to open the JSX line that renders it. It matches the element's CSS classes against `className` usages in the `.tsx` files and walks up to parent elements until one matches, so new components need no tagging.
- **Live edit:** `src/data/themes.ts` and `src/data/browserSections.ts` are editable. Edits are parsed as plain data (no code is evaluated), validated, and applied to the running desktop. Invalid edits show the error line and the desktop keeps the last valid version. Edits last until reload.
- **Timeline:** per-file commit history from the public GitHub API, with each commit shown as a diff against the previous one. Anonymous API calls are limited to 60 per hour per visitor, so responses are cached for the session and file contents come from `raw.githubusercontent.com`.
- **Architecture map:** a force-directed graph of every import, including lazy `import()`. Hover a file for its imports and importers; click to open it.
- **Elsewhere in the OS:** `code [FILE]` in the terminal, View source when right-clicking a window title bar, View page source on the desktop, and System > View source.

## Verification

Requires Node.js 22.15+ (or Node.js 24).

```bash
npm test
npm run build
```

Tests cover the shell, persistence, the Source Code app's import resolution, inspect matching, live-data parser and architecture graph, completion, keyboard editing, desktop callbacks, and React interactions in a DOM environment, including editor/pager controls at desktop and mobile dimensions. They run before deployment. They do not replace a real-browser layout check.
