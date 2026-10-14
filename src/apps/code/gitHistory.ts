export const REPO = "EmilSuuronen/SuuronenDev";
// shortcut: only the latest 50 commits per file are listed, paginate if a file's history outgrows that.
const COMMITS_PER_FILE = 50;

export type FileCommit = {
  author: string;
  date: string;
  message: string;
  sha: string;
  url: string;
};

type GitHubCommit = {
  commit: { author: { date: string; name: string } | null; message: string };
  html_url: string;
  sha: string;
};

// Unauthenticated GitHub API calls are limited to 60/hour per visitor, so every response is cached for the session.
const commitRequests = new Map<string, Promise<FileCommit[]>>();
const fileRequests = new Map<string, Promise<string>>();

function cached<T>(cache: Map<string, Promise<T>>, key: string, load: () => Promise<T>) {
  if (!cache.has(key)) {
    const request = load();
    // Failed requests are dropped so a retry actually refetches.
    request.catch(() => cache.delete(key));
    cache.set(key, request);
  }

  return cache.get(key)!;
}

async function request(url: string) {
  let response: Response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error("Couldn't reach GitHub");
  }

  if (response.status === 403 || response.status === 429) {
    throw new Error("GitHub's hourly limit for anonymous visitors was reached");
  }

  return response;
}

export function fetchFileCommits(path: string) {
  return cached(commitRequests, path, async () => {
    const response = await request(
      `https://api.github.com/repos/${REPO}/commits?path=${encodeURIComponent(path)}&per_page=${COMMITS_PER_FILE}`,
    );

    if (!response.ok) {
      throw new Error(`GitHub responded with ${response.status}`);
    }

    const commits = (await response.json()) as GitHubCommit[];

    return commits.map((item) => ({
      author: item.commit.author?.name ?? "unknown",
      date: item.commit.author?.date ?? "",
      message: item.commit.message,
      sha: item.sha,
      url: item.html_url,
    }));
  });
}

// raw.githubusercontent.com isn't counted against the API limit.
export function fetchFileAtCommit(sha: string, path: string) {
  return cached(fileRequests, `${sha}:${path}`, async () => {
    const response = await request(`https://raw.githubusercontent.com/${REPO}/${sha}/${path}`);

    // The file didn't exist under this path at that commit (e.g. before a rename).
    if (response.status === 404) {
      return "";
    }

    if (!response.ok) {
      throw new Error(`GitHub responded with ${response.status}`);
    }

    return response.text();
  });
}

const relativeTimeUnits: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
];

export function formatRelativeDate(date: string, now = Date.now(), locale = "en") {
  const seconds = (new Date(date).getTime() - now) / 1000;
  const format = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const [unit, size] = relativeTimeUnits.find(([, unitSeconds]) => Math.abs(seconds) >= unitSeconds) ?? ["second", 1];

  return format.format(Math.round(seconds / size), unit);
}
