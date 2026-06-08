import { describe, expect, it } from "vitest";
import {
  buildSshCommand,
  isSshPasswordPrompt,
  sftpConfigForHost,
  sshTarget,
} from "./sshCommand";
import type { HostProfile } from "@/modules/hosts/types";

const base: HostProfile = {
  id: "host-1",
  name: "Prod",
  hostname: "example.com",
  port: 22,
  username: "deploy",
  authMode: "agent",
  keyPath: "",
  remotePath: ".",
};

describe("sshCommand", () => {
  it("builds user targets", () => {
    expect(sshTarget(base)).toBe("deploy@example.com");
    expect(sshTarget({ ...base, username: "" })).toBe("example.com");
  });

  it("includes legacy RSA compatibility options", () => {
    expect(buildSshCommand(base)).toBe(
      "ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa 'deploy@example.com'",
    );
  });

  it("quotes key paths and non-default ports", () => {
    expect(
      buildSshCommand({
        ...base,
        port: 2222,
        authMode: "key",
        keyPath: "/Users/me/.ssh/prod key",
      }),
    ).toBe(
      "ssh -o HostKeyAlgorithms=+ssh-rsa -o PubkeyAcceptedKeyTypes=+ssh-rsa -p 2222 -i '/Users/me/.ssh/prod key' 'deploy@example.com'",
    );
  });

  it("includes passwords only for password sftp profiles", () => {
    expect(sftpConfigForHost(base, "secret").password).toBeNull();
    expect(
      sftpConfigForHost({ ...base, authMode: "password" }, "secret").password,
    ).toBe("secret");
  });

  it("detects ssh password prompts at the end of the terminal buffer", () => {
    expect(isSshPasswordPrompt("deploy@example.com's password: ")).toBe(true);
    expect(isSshPasswordPrompt("Password:")).toBe(true);
    expect(isSshPasswordPrompt("Enter passcode for deploy@example.com:")).toBe(
      false,
    );
    expect(isSshPasswordPrompt("Last login: Thu Jun 4 15:00:00")).toBe(false);
    expect(isSshPasswordPrompt("Password accepted\n$ ")).toBe(false);
  });
});
