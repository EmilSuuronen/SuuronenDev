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

## Verification

Requires Node.js 22.15+ (or Node.js 24).

```bash
npm test
npm run build
```

Tests cover the shell, persistence, completion, keyboard editing, desktop callbacks, and React interactions in a DOM environment, including editor/pager controls at desktop and mobile dimensions. They run before deployment. They do not replace a real-browser layout check.
