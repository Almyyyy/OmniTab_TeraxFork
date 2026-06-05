import { invoke } from "@tauri-apps/api/core";

export type BrowserPageLoadPayload = {
  label: string;
  url: string;
  event: "started" | "finished";
};

export type BrowserState = {
  url: string;
  title: string;
};

export function browserNavigate(label: string, url: string): Promise<void> {
  return invoke("browser_navigate", { label, url });
}

export function browserReload(label: string): Promise<void> {
  return invoke("browser_reload", { label });
}

export function browserStop(label: string): Promise<void> {
  return invoke("browser_stop", { label });
}

export function browserGoBack(label: string): Promise<void> {
  return invoke("browser_go_back", { label });
}

export function browserGoForward(label: string): Promise<void> {
  return invoke("browser_go_forward", { label });
}

export function browserSetZoom(label: string, zoom: number): Promise<void> {
  return invoke("browser_set_zoom", { label, zoom });
}

export function browserClearData(label: string): Promise<void> {
  return invoke("browser_clear_data", { label });
}

export function browserState(label: string): Promise<BrowserState> {
  return invoke("browser_state", { label });
}
