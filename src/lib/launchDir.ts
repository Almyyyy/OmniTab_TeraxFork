import { invoke } from "@tauri-apps/api/core";

let cached: string | undefined;

export async function initLaunchDir(): Promise<void> {
  const queryDir = launchDirFromQuery();
  if (queryDir) {
    cached = queryDir;
    return;
  }
  const dir =
    (await invoke<string | null>("get_launch_dir").catch(() => null)) ??
    (await invoke<string>("workspace_current_dir").catch(() => null));
  cached = dir ? dir.replace(/\\/g, "/") : undefined;
}

export function getLaunchDir(): string | undefined {
  return cached;
}

function launchDirFromQuery(): string | null {
  try {
    const url = new URL(window.location.href);
    const dir = url.searchParams.get("launchCwd");
    return dir ? dir.replace(/\\/g, "/") : null;
  } catch {
    return null;
  }
}
