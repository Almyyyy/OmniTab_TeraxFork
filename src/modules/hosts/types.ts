export type HostAuthMode = "agent" | "key" | "password";

export type HostProfile = {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  authMode: HostAuthMode;
  keyPath: string;
  remotePath: string;
};

export type HostDraft = Omit<HostProfile, "id">;

export type SftpHostConfig = {
  hostname: string;
  port: number;
  username: string | null;
  keyPath: string | null;
  password: string | null;
};

export type SftpEntry = {
  name: string;
  path: string;
  isDir: boolean;
  size: number | null;
  modified: string | null;
  permissions: string;
};
