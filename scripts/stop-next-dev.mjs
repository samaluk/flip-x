import { readFile } from "node:fs/promises";

const lockPath = new URL("../.next/dev/lock", import.meta.url);

async function readLock() {
  try {
    // oxlint-disable-next-line typescript/no-unsafe-return
    return JSON.parse(await readFile(lockPath, "utf8"));
  } catch {
    return null;
  }
}

function isRunning(pid) {
  try {
    // oxlint-disable-next-line typescript/no-unsafe-argument
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

// oxlint-disable-next-line typescript/no-unsafe-assignment
const lock = await readLock();

// oxlint-disable-next-line typescript/no-unsafe-member-access
if (lock?.pid && isRunning(lock.pid)) {
  // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
  process.kill(lock.pid, "SIGTERM");

  // oxlint-disable-next-line typescript/no-unsafe-member-access
  if (!(await waitForExit(lock.pid, 5_000)) && isRunning(lock.pid)) {
    // oxlint-disable-next-line typescript/no-unsafe-argument, typescript/no-unsafe-member-access
    process.kill(lock.pid, "SIGKILL");
  }
}
