import { invoke } from "@tauri-apps/api/core";

const HOSTS_KEYRING_SERVICE = "omnitab-hosts";

function passwordAccount(hostId: string): string {
  return `${hostId}:password`;
}

export async function getHostPassword(hostId: string): Promise<string | null> {
  try {
    const value = await invoke<string | null>("secrets_get", {
      service: HOSTS_KEYRING_SERVICE,
      account: passwordAccount(hostId),
    });
    return value && value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

export async function setHostPassword(
  hostId: string,
  password: string,
): Promise<void> {
  if (!password) throw new Error("Password is empty");
  await invoke("secrets_set", {
    service: HOSTS_KEYRING_SERVICE,
    account: passwordAccount(hostId),
    password,
  });
}

export async function clearHostPassword(hostId: string): Promise<void> {
  try {
    await invoke("secrets_delete", {
      service: HOSTS_KEYRING_SERVICE,
      account: passwordAccount(hostId),
    });
  } catch {
    // already absent
  }
}
