import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const ROOT_DIR = path.resolve(__dirname, "../..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

describe("Vercel Deployment Storage & Preview Guardrails", () => {
  it("locks Vercel builds strictly to main / production and blocks preview branches", () => {
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, "vercel.json"), "utf-8"));

    expect(vercelConfig.git?.deploymentEnabled?.main).toBe(true);
    expect(vercelConfig.git?.deploymentEnabled?.live).toBe(false);
    expect(vercelConfig.git?.deploymentEnabled?.demo).toBe(false);
    expect(typeof vercelConfig.ignoreCommand).toBe("string");
    expect(vercelConfig.ignoreCommand).toContain("VERCEL_GIT_COMMIT_REF");
    expect(vercelConfig.ignoreCommand).toContain("main");
  });

  it("excludes non-runtime directories in .vercelignore", () => {
    const vercelIgnore = fs.readFileSync(path.join(ROOT_DIR, ".vercelignore"), "utf-8");
    for (const entry of ["docs", "database", "supabase", "src/__tests__", "build", "node_modules"]) {
      expect(vercelIgnore).toContain(entry);
    }
  });

  it("enforces the 500 KB per-file and 25 MB total budget on public/ static assets", () => {
    const MAX_SINGLE_FILE_BYTES = 500 * 1024;
    const MAX_TOTAL_PUBLIC_BYTES = 25 * 1024 * 1024;
    let totalBytes = 0;
    const oversized: string[] = [];

    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === ".DS_Store") continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile()) {
          const { size } = fs.statSync(fullPath);
          totalBytes += size;
          if (size > MAX_SINGLE_FILE_BYTES) {
            oversized.push(`${path.relative(PUBLIC_DIR, fullPath)} (${Math.round(size / 1024)} KB)`);
          }
        }
      }
    };

    walk(PUBLIC_DIR);

    expect(oversized).toEqual([]);
    expect(totalBytes).toBeLessThanOrEqual(MAX_TOTAL_PUBLIC_BYTES);
  });

  it("prevents duplicate .png + .webp files in public/cards and public/vehicles", () => {
    for (const subDir of ["cards", "vehicles"]) {
      const dir = path.join(PUBLIC_DIR, subDir);
      const files = fs.readdirSync(dir).filter((f) => f !== ".DS_Store");
      const stems = new Map<string, string[]>();

      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const stem = path.basename(file, ext);
        const list = stems.get(stem) || [];
        list.push(ext);
        stems.set(stem, list);
      }

      const duplicates = Array.from(stems.entries()).filter(
        ([, exts]) => exts.includes(".png") && exts.includes(".webp")
      );
      expect(duplicates).toEqual([]);
    }
  });
});
