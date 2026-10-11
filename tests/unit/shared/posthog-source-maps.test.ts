import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { NextConfig } from "next";
import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

test("the production hook injects IDs into server chunks before uploading source maps", async () => {
  const releaseId = "00000000-0000-4000-8000-000000000001";
  const uploadBatches: { chunk_id: string; release_id: string; content_hash: string }[][] = [];
  const server = createServer(async (request, response) => {
    response.setHeader("Content-Type", "application/json");
    if (request.url?.includes("/error_tracking/releases/")) {
      response.end(
        JSON.stringify({ id: releaseId, hash_id: "test", version: "test", project: "flip-x" }),
      );
      return;
    }
    if (request.url?.includes("/error_tracking/symbol_sets/bulk_start_upload")) {
      let body = "";
      for await (const chunk of request) body += chunk;
      uploadBatches.push(JSON.parse(body).symbol_sets);
      // Pretend the symbol sets are already stored, avoiding object-storage I/O.
      response.end(JSON.stringify({ id_map: {} }));
      return;
    }
    if (request.url?.includes("/error_tracking/symbol_sets/bulk_finish_upload")) {
      response.end("{}");
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ detail: "Unexpected test API endpoint" }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Missing test server address");

  const distDir = await mkdtemp(path.join(tmpdir(), "flip-x-posthog-"));
  try {
    vi.stubEnv("POSTHOG_API_KEY", "phx_test");
    vi.stubEnv("POSTHOG_PROJECT_ID", "1");
    vi.stubEnv("NEXT_PUBLIC_POSTHOG_HOST", `http://127.0.0.1:${address.port}`);
    vi.stubEnv("POSTHOG_RELEASE_ID", releaseId);
    vi.stubEnv("POSTHOG_RELEASE_MODE", "event");
    vi.stubEnv("WEBPACK", "0");
    vi.stubEnv("TURBOPACK", "1");
    vi.resetModules();

    const chunkPath = path.join(distDir, "server/chunks/ssr/chunk.js");
    await mkdir(path.dirname(chunkPath), { recursive: true });
    // Turbopack's server output may have a map without a native debug ID.
    await writeFile(chunkPath, 'console.log("server");\n//# sourceMappingURL=chunk.js.map\n');
    await writeFile(
      `${chunkPath}.map`,
      JSON.stringify({
        version: 3,
        file: "chunk.js",
        sources: ["server.ts"],
        sourcesContent: ['console.log("server");'],
        names: [],
        mappings: "AAAA",
      }),
    );

    const { default: nextConfig } = await import("../../../next.config");
    // The wrapper's declared NextConfig type omits its async config-function form.
    const configure = nextConfig as
      | NextConfig
      | ((phase: string, options: { defaultConfig: NextConfig }) => Promise<NextConfig>);
    const config =
      typeof configure === "function"
        ? await configure("phase-production-build", { defaultConfig: {} })
        : configure;
    const hook = config.compiler?.runAfterProductionCompile;
    if (!hook) throw new Error("Missing production source-map hook");
    await hook({ distDir, projectDir: process.cwd() });

    expect(uploadBatches.flat()).toEqual([
      { chunk_id: expect.any(String), release_id: releaseId, content_hash: expect.any(String) },
    ]);
    const chunk = await readFile(chunkPath, "utf8");
    expect(chunk).toContain("_posthogChunkIds");
    expect(chunk).not.toContain("sourceMappingURL");
    await expect(readFile(`${chunkPath}.map`)).rejects.toMatchObject({ code: "ENOENT" });
  } finally {
    await rm(distDir, { recursive: true, force: true });
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}, 15_000);
