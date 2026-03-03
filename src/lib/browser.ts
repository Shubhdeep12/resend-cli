/**
 * Open a URL in the default browser. No-op on unsupported platforms or if spawn fails.
 */
import { spawn } from "node:child_process";
import { platform } from "node:os";
import * as readline from "node:readline";

const DASHBOARD_BASE = "https://resend.com";

/** True if string looks like a Resend resource ID (UUID). */
export function isLikelyId(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    s.trim(),
  );
}

export function dashboardUrl(path: string): string {
  const base = DASHBOARD_BASE.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/**
 * Open url in system default browser. Returns true if launched, false otherwise.
 */
export function openInBrowser(url: string): boolean {
  const p = platform();
  let cmd: string;
  let args: string[];

  if (p === "darwin") {
    cmd = "open";
    args = [url];
  } else if (p === "win32") {
    cmd = "cmd";
    args = ["/c", "start", "", url];
  } else {
    cmd = "xdg-open";
    args = [url];
  }

  try {
    const child = spawn(cmd, args, {
      stdio: "ignore",
      shell: p === "win32",
    });
    child.on("error", () => {});
    child.unref();
    return true;
  } catch {
    return false;
  }
}

export function waitForEnter(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question("", () => {
      rl.close();
      resolve();
    });
  });
}
