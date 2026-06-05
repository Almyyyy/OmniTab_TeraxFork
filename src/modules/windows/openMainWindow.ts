import { invoke } from "@tauri-apps/api/core";

export async function openMainWindow(cwd?: string | null): Promise<string> {
  return await invoke<string>("open_main_window", { cwd: cwd ?? null });
}
