import { invoke } from "@tauri-apps/api/core";

export async function openMainWindow(cwd?: string | null): Promise<void> {
  await invoke("open_main_window", { cwd: cwd ?? null });
}
