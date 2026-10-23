/** Device preferences are optional: blocked or invalid storage never prevents play. */
export function readStored<T>(key: string, parse: (raw: string) => T | undefined, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : parse(raw) ?? fallback
  } catch {
    return fallback
  }
}

export function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // The session remains playable when storage is unavailable.
  }
}
