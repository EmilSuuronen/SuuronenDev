import { browserSections } from "../../data/browserSections";
import { contactLinks } from "../../data/contactLinks";
import { techStackGroups } from "../../data/techStackGroups";

export const HOME = "/home/emil";
export const MAX_FILE_SIZE = 128 * 1024;
export const MAX_STORAGE_SIZE = 1024 * 1024;
const byteSize = (content: string) => new TextEncoder().encode(content).length;
export type FileNode = {
  type: "file" | "directory";
  content: string;
  modified: number;
};
export type SavedFile = [string, FileNode];

export function resolvePath(path: string, cwd = HOME): string {
  const expanded =
    path === "~" || path.startsWith("~/") ? HOME + path.slice(1) : path;
  const parts: string[] = [];
  for (const part of (expanded.startsWith("/")
    ? expanded
    : `${cwd}/${expanded}`
  ).split("/")) {
    if (part === "..") parts.pop();
    else if (part && part !== ".") parts.push(part);
  }
  return `/${parts.join("/")}`;
}

export const parentPath = (path: string) =>
  path.slice(0, path.lastIndexOf("/")) || "/";
export const baseName = (path: string) =>
  path.slice(path.lastIndexOf("/") + 1) || "/";
export const displayPath = (path: string) =>
  path === HOME
    ? "~"
    : path.startsWith(`${HOME}/`)
      ? `~${path.slice(HOME.length)}`
      : path;
export const isWritablePath = (path: string) =>
  (path.startsWith(`${HOME}/`) &&
    !path.startsWith(`${HOME}/Notes/`) &&
    path !== `${HOME}/Notes`) ||
  path.startsWith("/tmp/");

export class VirtualFileSystem {
  private nodes = new Map<string, FileNode>();

  constructor(saved?: SavedFile[]) {
    const directories = [
      "/",
      "/home",
      HOME,
      "/tmp",
      "/etc",
      "/usr",
      "/usr/bin",
      "/proc",
      `${HOME}/Documents`,
      `${HOME}/Downloads`,
      `${HOME}/Notes`,
      `${HOME}/applications`,
      `${HOME}/browser`,
      `${HOME}/projects`,
      `${HOME}/projects/suuronen.dev`,
      `${HOME}/.secrets`,
    ];
    directories.forEach((path) => this.seed(path, "directory"));
    const files: Record<string, string> = {
      [`${HOME}/about.txt`]: `${browserSections[0].description}\n`,
      [`${HOME}/stack.txt`]:
        techStackGroups
          .map(
            (group) =>
              `${group.label}\n${group.sections.flatMap((section) => section.items.map((item) => item.label)).join(", ")}`,
          )
          .join("\n\n") + "\n",
      [`${HOME}/contact.txt`]:
        contactLinks.map((link) => `${link.label}: ${link.href}`).join("\n") +
        "\n",
      [`${HOME}/README.txt`]:
        "Welcome to Emil's desktop.\n\nThis is a browser shell with an Ubuntu-inspired userspace.\nFiles in your home directory are saved in this browser. /tmp is temporary.\nSystem files and Notes are read-only. Notes mirrors the desktop Notes app.\nNo commands run on your computer or on a remote server.\n\nTry:\n  ls -la\n  cat about.txt\n  cat stack.txt | grep -i python\n  mkdir -p projects/playground\n  echo 'Hello, world' > projects/playground/hello.txt\n  nano projects/playground/hello.txt\n  open browser\n  help\n\nCurious? Hidden files are usually hidden for a reason.\n",
      [`${HOME}/.bashrc`]:
        "# This browser shell starts with these aliases.\n# Edit aliases interactively with the alias command; this file is not executed.\nalias ll='ls -al'\nalias la='ls -a'\nalias l='ls'\n# A small detour: cat ~/.secrets/README\n",
      [`${HOME}/.secrets/README`]:
        "You found the service entrance.\n\nThe developer runs on coffee. Try: coffee\nThe package manager has a soft spot for cattle. Try: apt moo\nOne misplaced letter can take you somewhere. Try: sl\nA tiny world waits in: adventure\n\nThe final clue is in signal.txt. Decode it with base64 -d.\n",
      [`${HOME}/.secrets/signal.txt`]:
        "VGhlIGFudHMgZm91bmQgdGhlIGtlcm5lbC4gUnVuOiBhbnRzCg==\n",
      [`${HOME}/projects/suuronen.dev/README.md`]:
        "# SuuronenDev\n\nEmil Suuronen's interactive desktop portfolio.\nReact + TypeScript + Vite.\n\nSource: https://github.com/EmilSuuronen/SuuronenDev\nWebsite: https://suuronen.dev\n\nRun `open browser` to explore the portfolio.\n",
      [`${HOME}/browser/bookmarks.txt`]:
        "https://suuronen.dev\nhttps://github.com/EmilSuuronen\nhttps://emilsuuronen.github.io/molkkis/\n",
      "/etc/os-release":
        'NAME="Ubuntu (browser sandbox)"\nID=ubuntu\nPRETTY_NAME="Ubuntu-inspired Suuronen Desktop"\nHOME_URL="https://suuronen.dev"\n',
      "/etc/hostname": "desktop\n",
      "/etc/passwd":
        "root:x:0:0:root:/root:/bin/bash\nemil:x:1000:1000:Emil Suuronen:/home/emil:/bin/bash\n",
      "/etc/motd": "Welcome to Suuronen Desktop. Have a look around.\n",
    };
    for (const app of [
      "browser",
      "calculator",
      "settings",
      "notes",
      "terminal",
      "antgame",
      "molkkis",
    ]) {
      files[`${HOME}/applications/${app}.desktop`] =
        `[Desktop Entry]\nType=Application\nName=${app}\nExec=open ${app}\n`;
    }
    Object.entries(files).forEach(([path, content]) =>
      this.seed(path, "file", content),
    );
    if (saved) this.restore(saved);
  }

  private seed(path: string, type: FileNode["type"], content = "") {
    this.nodes.set(path, { type, content, modified: Date.now() });
  }

  get(path: string) {
    return this.nodes.get(path);
  }
  entries() {
    return [...this.nodes.entries()];
  }
  children(path: string) {
    this.requireDirectory(path);
    return this.entries()
      .filter(([name]) => name !== path && parentPath(name) === path)
      .sort(([a], [b]) => a.localeCompare(b));
  }
  requireDirectory(path: string) {
    const node = this.get(path);
    if (!node) throw new Error(`${path}: No such file or directory`);
    if (node.type !== "directory") throw new Error(`${path}: Not a directory`);
  }
  read(path: string) {
    if (path === "/dev/null") return "";
    const node = this.get(path);
    if (!node) throw new Error(`${path}: No such file or directory`);
    if (node.type === "directory") throw new Error(`${path}: Is a directory`);
    return node.content;
  }
  private validateWrite(path: string) {
    if (!isWritablePath(path)) throw new Error(`${path}: Permission denied`);
    if (
      path.length > 1024 ||
      baseName(path).length > 255 ||
      /[\x00-\x1f]/.test(path)
    )
      throw new Error(`${path}: Invalid file name`);
    this.requireDirectory(parentPath(path));
    if (!this.get(path) && this.nodes.size >= 512)
      throw new Error("No space left on device (512 files maximum)");
  }
  write(path: string, content: string, append = false) {
    if (path === "/dev/null") return;
    this.validateWrite(path);
    const previous = this.get(path);
    if (previous?.type === "directory")
      throw new Error(`${path}: Is a directory`);
    const next = (append ? (previous?.content ?? "") : "") + content;
    if (byteSize(next) > MAX_FILE_SIZE)
      throw new Error(`${path}: File too large (128 KiB maximum)`);
    const size =
      this.entries().reduce(
        (total, [, node]) => total + byteSize(node.content),
        0,
      ) -
      byteSize(previous?.content ?? "") +
      byteSize(next);
    if (size > MAX_STORAGE_SIZE)
      throw new Error("No space left on device (1 MiB maximum)");
    this.seed(path, "file", next);
  }
  mkdir(path: string, parents = false) {
    if (this.get(path)) {
      if (parents && this.get(path)?.type === "directory") return;
      throw new Error(`${path}: File exists`);
    }
    if (parents && !this.get(parentPath(path)))
      this.mkdir(parentPath(path), true);
    this.validateWrite(path);
    this.seed(path, "directory");
  }
  remove(path: string, recursive = false, directoryOnly = false) {
    this.validateWrite(path);
    const node = this.get(path);
    if (!node) throw new Error(`${path}: No such file or directory`);
    if (directoryOnly && node.type !== "directory")
      throw new Error(`${path}: Not a directory`);
    const descendants = this.entries().filter(([name]) =>
      name.startsWith(`${path}/`),
    );
    if (node.type === "directory" && !recursive && !directoryOnly)
      throw new Error(`${path}: Is a directory`);
    if (descendants.length && !recursive)
      throw new Error(`${path}: Directory not empty`);
    this.nodes.delete(path);
    descendants.forEach(([name]) => this.nodes.delete(name));
  }
  copy(source: string, destination: string, recursive = false, move = false) {
    const node = this.get(source);
    if (!node) throw new Error(`${source}: No such file or directory`);
    const target =
      this.get(destination)?.type === "directory"
        ? `${destination}/${baseName(source)}`
        : destination;
    if (target === source || target.startsWith(`${source}/`))
      throw new Error("Cannot copy or move a file into itself");
    if (node.type === "directory" && !recursive && !move)
      throw new Error(`${source}: -r not specified; omitting directory`);
    if (
      move &&
      node.type === "directory" &&
      this.get(target)?.type === "directory" &&
      this.children(target).length
    )
      throw new Error(`${target}: Directory not empty`);
    if (move) this.validateWrite(source);
    // Roll back a partial copy on quota or path errors; moving must not lose data.
    const before = new Map(this.nodes);
    try {
      const entries = [
        [source, node] as SavedFile,
        ...this.entries().filter(([path]) => path.startsWith(`${source}/`)),
      ];
      for (const [path, entry] of entries.sort(
        ([a], [b]) => a.length - b.length,
      )) {
        const nextPath = target + path.slice(source.length);
        if (entry.type === "directory") this.mkdir(nextPath, true);
        else this.write(nextPath, entry.content);
      }
      if (move) this.remove(source, true);
    } catch (error) {
      this.nodes = before;
      throw error;
    }
  }
  mountNotes(notes: { name: string; content: string }[]) {
    for (const [path] of this.nodes)
      if (path.startsWith(`${HOME}/Notes/`)) this.nodes.delete(path);
    for (const note of notes.slice(0, 200))
      this.seed(
        `${HOME}/Notes/${note.name}`,
        "file",
        note.content.slice(0, MAX_FILE_SIZE),
      );
  }
  snapshot(): SavedFile[] {
    return this.entries().filter(
      ([path]) => isWritablePath(path) && path.startsWith(`${HOME}/`),
    );
  }
  private restore(saved: SavedFile[]) {
    if (!Array.isArray(saved) || saved.length > 512)
      throw new Error("Invalid saved filesystem");
    for (const [path] of this.snapshot()) this.nodes.delete(path);
    let size = 0;
    for (const entry of saved) {
      if (!Array.isArray(entry) || entry.length !== 2)
        throw new Error("Invalid saved file");
      const [path, node] = entry;
      if (
        typeof path !== "string" ||
        resolvePath(path) !== path ||
        !path.startsWith(`${HOME}/`) ||
        !node ||
        !["file", "directory"].includes(node.type) ||
        typeof node.content !== "string" ||
        !Number.isFinite(node.modified)
      )
        throw new Error("Invalid saved file");
      size += byteSize(node.content);
      if (byteSize(node.content) > MAX_FILE_SIZE || size > MAX_STORAGE_SIZE)
        throw new Error("Saved filesystem exceeds quota");
    }
    for (const [path, node] of [...saved].sort(
      ([a], [b]) => a.length - b.length,
    )) {
      this.validateWrite(path);
      this.nodes.set(path, {
        type: node.type,
        content: node.type === "file" ? node.content : "",
        modified: node.modified,
      });
    }
  }
}
