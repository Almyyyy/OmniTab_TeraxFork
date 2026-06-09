export type HostSourceValue = "local" | `host:${string}`;

const SOURCE_STORAGE_KEY = "omnitab.files.source";

export function sourceForHost(id: string): HostSourceValue {
  return `host:${id}`;
}

export function readSelectedSource(): HostSourceValue {
  try {
    const stored = window.localStorage.getItem(SOURCE_STORAGE_KEY);
    if (stored === "local" || stored?.startsWith("host:")) {
      return stored as HostSourceValue;
    }
  } catch {
    // ignore
  }
  return "local";
}

export function writeSelectedSource(source: HostSourceValue): void {
  try {
    window.localStorage.setItem(SOURCE_STORAGE_KEY, source);
  } catch {
    // storage may fail in private mode
  }
}
