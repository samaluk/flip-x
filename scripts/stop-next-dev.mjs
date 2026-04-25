import { readFile } from "node:fs/promises";

const lockPath = new URL("../.next/dev/lock", import.meta.url);

async function readLock() {
  try {
    return JSON.parse(await readFile(lockPath, "utf8"));
  } catch {
    return null;
  }
}

function isRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForExit(pid, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (!isRunning(pid)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

const lock = await readLock();

if (lock?.pid && isRunning(lock.pid)) {
  process.kill(lock.pid, "SIGTERM");

  if (!(await waitForExit(lock.pid, 5_000)) && isRunning(lock.pid)) {
    process.kill(lock.pid, "SIGKILL");
  }
}
