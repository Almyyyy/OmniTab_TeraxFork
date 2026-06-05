import { quoteShellArg } from "@/lib/shellQuote";
import type { HostProfile, SftpHostConfig } from "@/modules/hosts/types";

export function sshTarget(host: Pick<HostProfile, "hostname" | "username">): string {
  const hostname = host.hostname.trim();
  const username = host.username.trim();
  return username ? `${username}@${hostname}` : hostname;
}

export function buildSshCommand(host: HostProfile): string {
  const args = ["ssh"];
  if (host.port !== 22) args.push("-p", String(host.port));
  if (host.authMode === "key" && host.keyPath.trim()) {
    args.push("-i", quoteShellArg(host.keyPath.trim()));
  }
  args.push(quoteShellArg(sshTarget(host)));
  return args.join(" ");
}

export function isSshPasswordPrompt(buffer: string): boolean {
  return /(?:^|[\r\n])[^\r\n]*password[^\r\n]*:\s*$/i.test(buffer);
}

export function sftpConfigForHost(
  host: HostProfile,
  password?: string | null,
): SftpHostConfig {
  return {
    hostname: host.hostname.trim(),
    port: host.port,
    username: host.username.trim() || null,
    keyPath:
      host.authMode === "key" && host.keyPath.trim()
        ? host.keyPath.trim()
        : null,
    password: host.authMode === "password" ? (password ?? null) : null,
  };
}
