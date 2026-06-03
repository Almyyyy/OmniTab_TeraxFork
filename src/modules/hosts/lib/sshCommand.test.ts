import { describe, expect, it } from "vitest";
import { buildSshCommand, sftpConfigForHost, sshTarget } from "./sshCommand";
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

  it("omits default options", () => {
    expect(buildSshCommand(base)).toBe("ssh 'deploy@example.com'");
  });

  it("quotes key paths and non-default ports", () => {
    expect(
      buildSshCommand({
        ...base,
        port: 2222,
        authMode: "key",
        keyPath: "/Users/me/.ssh/prod key",
      }),
    ).toBe("ssh -p 2222 -i '/Users/me/.ssh/prod key' 'deploy@example.com'");
  });

  it("includes passwords only for password sftp profiles", () => {
    expect(sftpConfigForHost(base, "secret").password).toBeNull();
    expect(
      sftpConfigForHost({ ...base, authMode: "password" }, "secret").password,
    ).toBe("secret");
  });
});
