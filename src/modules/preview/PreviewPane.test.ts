import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Source-level regression test for browser tabs.
 * Rendering the native child webview requires the Tauri runtime, so this test
 * verifies the important integration and URL boundary from source.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(here, "PreviewPane.tsx"), "utf8");

describe("PreviewPane native browser webview", () => {
  it("uses a Tauri child webview instead of an iframe", () => {
    expect(src).toContain('@tauri-apps/api/webview');
    expect(src).toContain("new Webview(");
    expect(src).not.toContain("<iframe");
  });

  it("listens to native page-load events from the Rust webview hook", () => {
    expect(src).toContain("omnitab:browser-page-load");
    expect(src).toContain("BrowserPageLoadPayload");
  });

  it("only accepts http and https browser targets", () => {
    expect(src).toContain('url.protocol === "http:"');
    expect(src).toContain('url.protocol === "https:"');
    expect(src).toContain("Browser tabs support http and https URLs.");
  });
});
