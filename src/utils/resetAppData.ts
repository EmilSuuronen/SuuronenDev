const APP_STORAGE_PREFIX = "suuronen.desktop";

export async function resetAppData() {
  try {
    const localStorageKeys: string[] = [];

    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);

      if (key?.startsWith(APP_STORAGE_PREFIX)) {
        localStorageKeys.push(key);
      }
    }

    localStorageKeys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // ignore storage failures
  }

  try {
    const sessionStorageKeys: string[] = [];

    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);

      if (key?.startsWith(APP_STORAGE_PREFIX)) {
        sessionStorageKeys.push(key);
      }
    }

    sessionStorageKeys.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // ignore storage failures
  }

  if ("caches" in window) {
    try {
      const cacheKeys = await window.caches.keys();
      await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
    } catch {
      // ignore cache storage failures
    }
  }
}
