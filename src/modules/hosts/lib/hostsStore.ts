import { emit, listen } from "@tauri-apps/api/event";
import { LazyStore } from "@tauri-apps/plugin-store";
import { create } from "zustand";
import type { HostDraft, HostProfile } from "@/modules/hosts/types";

const STORE_PATH = "omnitab-hosts.json";
const KEY_HOSTS = "hosts";
const CHANGED_EVENT = "omnitab://hosts-changed";

const store = new LazyStore(STORE_PATH, { defaults: {}, autoSave: 200 });

type State = {
  hydrated: boolean;
  hosts: HostProfile[];
  hydrate: () => Promise<void>;
  upsert: (host: HostProfile | HostDraft) => void;
  remove: (id: string) => void;
};

let initialized = false;

export function newHostId(): string {
  return `host-${crypto.randomUUID()}`;
}

async function loadHosts(): Promise<HostProfile[]> {
  const stored = await store.get<unknown>(KEY_HOSTS);
  if (!Array.isArray(stored)) return [];
  return stored.map(normalizeHost).filter((h): h is HostProfile => h !== null);
}

async function saveHosts(hosts: HostProfile[]): Promise<void> {
  await store.set(KEY_HOSTS, hosts);
  await store.save();
}

function normalizeHost(value: unknown): HostProfile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<Record<keyof HostProfile, unknown>>;
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const hostname = typeof raw.hostname === "string" ? raw.hostname.trim() : "";
  const username = typeof raw.username === "string" ? raw.username.trim() : "";
  const keyPath = typeof raw.keyPath === "string" ? raw.keyPath.trim() : "";
  const remotePath =
    typeof raw.remotePath === "string" && raw.remotePath.trim()
      ? raw.remotePath.trim()
      : ".";
  const port = clampPort(Number(raw.port));
  const authMode =
    raw.authMode === "key" || raw.authMode === "password"
      ? raw.authMode
      : "agent";
  if (!id || !hostname) return null;
  return {
    id,
    name: name || hostname,
    hostname,
    port,
    username,
    authMode,
    keyPath,
    remotePath,
  };
}

function normalizeDraft(input: HostProfile | HostDraft): HostProfile {
  const id = "id" in input ? input.id : newHostId();
  const hostname = input.hostname.trim();
  const name = input.name.trim() || hostname;
  return {
    id,
    name,
    hostname,
    port: clampPort(input.port),
    username: input.username.trim(),
    authMode: input.authMode,
    keyPath: input.keyPath.trim(),
    remotePath: input.remotePath.trim() || ".",
  };
}

function clampPort(value: number): number {
  if (!Number.isFinite(value)) return 22;
  return Math.min(65535, Math.max(1, Math.round(value)));
}

function broadcast(): void {
  void emit(CHANGED_EVENT);
}

export const useHostsStore = create<State>((set, get) => ({
  hydrated: false,
  hosts: [],
  hydrate: async () => {
    if (initialized) return;
    initialized = true;
    set({ hosts: await loadHosts(), hydrated: true });
    void listen(CHANGED_EVENT, async () => {
      set({ hosts: await loadHosts() });
    });
  },
  upsert: (input) => {
    const host = normalizeDraft(input);
    const list = get().hosts;
    const idx = list.findIndex((h) => h.id === host.id);
    const next =
      idx === -1
        ? [...list, host]
        : list.map((h) => (h.id === host.id ? host : h));
    set({ hosts: next });
    void saveHosts(next).then(broadcast);
  },
  remove: (id) => {
    const next = get().hosts.filter((h) => h.id !== id);
    set({ hosts: next });
    void saveHosts(next).then(broadcast);
  },
}));
