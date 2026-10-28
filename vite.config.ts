import { defineConfig, type ESBuildOptions } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import url from "url";

export default defineConfig(({ mode }) => ({
  esbuild: mode === "production" ? ({ drop: ["console", "debugger"] } as ESBuildOptions) : undefined,
  plugins: [
    react(),
    {
      name: "public-asset-budget-guard",
      buildStart() {
        if (mode !== "production") return;
        const publicDir = path.resolve(__dirname, "public");
        if (!fs.existsSync(publicDir)) return;

        const MAX_SINGLE_FILE_BYTES = 500 * 1024; // 500 KB per asset
        const MAX_TOTAL_PUBLIC_BYTES = 25 * 1024 * 1024; // 25 MB total public/ budget
        let totalBytes = 0;
        const oversizedFiles: string[] = [];

        const walk = (dir: string) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          const stemsByExt = new Map<string, Set<string>>();

          for (const entry of entries) {
            if (entry.name === ".DS_Store") continue;
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
              walk(fullPath);
            } else if (entry.isFile()) {
              const { size } = fs.statSync(fullPath);
              totalBytes += size;
              const relPath = path.relative(publicDir, fullPath);
              if (size > MAX_SINGLE_FILE_BYTES) {
                oversizedFiles.push(`${relPath} (${(size / 1024).toFixed(1)} KB > 500 KB)`);
              }
              const ext = path.extname(entry.name).toLowerCase();
              const stem = path.basename(entry.name, ext);
              if (ext === ".png" || ext === ".webp") {
                const exts = stemsByExt.get(stem) || new Set<string>();
                exts.add(ext);
                stemsByExt.set(stem, exts);
              }
            }
          }

          const relDir = path.relative(publicDir, dir);
          if (relDir === "cards" || relDir === "vehicles") {
            for (const [stem, exts] of stemsByExt.entries()) {
              if (exts.has(".png") && exts.has(".webp")) {
                throw new Error(
                  `[public-asset-budget-guard] Duplicate .png and .webp asset detected in public/${relDir}/${stem}.{png,webp}. Keep only one format to prevent Vercel Deployment Storage bloat.`
                );
              }
            }
          }
        };

        walk(publicDir);

        if (oversizedFiles.length > 0) {
          throw new Error(
            `[public-asset-budget-guard] Oversized static assets in public/ exceed 500 KB budget:\n  - ${oversizedFiles.join("\n  - ")}`
          );
        }

        if (totalBytes > MAX_TOTAL_PUBLIC_BYTES) {
          throw new Error(
            `[public-asset-budget-guard] Total public/ directory size (${(totalBytes / 1024 / 1024).toFixed(2)} MB) exceeds the 25 MB Vercel Deployment Storage budget.`
          );
        }
      },
    },
    {
      name: "strip-console-production",
      transform(code, id) {
        if (mode === "production" && !id.includes("node_modules") && (id.endsWith(".ts") || id.endsWith(".tsx") || id.endsWith(".js"))) {
          const stripped = code.replace(/console\.(log|debug)\([^)]*\);?/g, "");
          return { code: stripped, map: null };
        }
        return null;
      },
    },
    {
      name: "local-api-runner",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const reqUrl = req.url || "";
          if (reqUrl.startsWith("/api/")) {
            const parsedUrl = new URL(reqUrl, `http://${req.headers.host || "localhost"}`);
            const apiName = parsedUrl.pathname?.slice(5); // remove '/api/'
            const apiPath = path.resolve(__dirname, "api", `${apiName}.js`);

            if (fs.existsSync(apiPath)) {
              const originalSetHeader = res.setHeader.bind(res);
              const originalEnd = res.end.bind(res);
              try {
                // Clear node require cache to reload API on each request
                delete require.cache[require.resolve(apiPath)];
                const handler = require(apiPath);

                // Load environment variables from .env if present
                const envPath = path.resolve(__dirname, ".env");
                if (fs.existsSync(envPath)) {
                  const envContent = fs.readFileSync(envPath, "utf-8");
                  envContent.split("\n").forEach((line) => {
                    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
                    if (match) {
                      const key = match[1];
                      let value = match[2] || "";
                      if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                      } else if (value.startsWith("'") && value.endsWith("'")) {
                        value = value.slice(1, -1);
                      }
                      process.env[key] = value.trim();
                    }
                  });
                }

                const mockReq = req as any;
                mockReq.headers = req.headers || {};
                const query: Record<string, string> = {};
                parsedUrl.searchParams.forEach((val, key) => {
                  query[key] = val;
                });
                mockReq.query = query;

                if (req.method === "POST" || req.method === "PUT") {
                  const buffers = [];
                  for await (const chunk of req) {
                    buffers.push(chunk);
                  }
                  const bodyText = Buffer.concat(buffers).toString();
                  try {
                    mockReq.body = JSON.parse(bodyText);
                  } catch {
                    mockReq.body = bodyText;
                  }
                }

                const mockRes = res as any;
                mockRes.status = (code: number) => {
                  res.statusCode = code;
                  return mockRes;
                };
                mockRes.json = (data: any) => {
                  originalSetHeader("Content-Type", "application/json");
                  originalEnd(JSON.stringify(data));
                  return mockRes;
                };
                mockRes.send = (data: any) => {
                  originalEnd(typeof data === "object" ? JSON.stringify(data) : String(data));
                  return mockRes;
                };
                mockRes.setHeader = (name: string, value: string) => {
                  originalSetHeader(name, value);
                  return mockRes;
                };
                mockRes.end = (...args: any[]) => {
                  return originalEnd(...args);
                };

                await handler(mockReq, mockRes);
                return;
              } catch (err) {
                console.error("Local API execution error:", err);
                res.statusCode = 500;
                originalSetHeader("Content-Type", "application/json");
                originalEnd(JSON.stringify({ error: "Local API execution error", details: String(err) }));
                return;
              }
            }
          }
          next();
        });
      },
    },
  ],
  build: {
    outDir: "build",
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom") || id.includes("node_modules/react-is")) {
            return "vendor-react";
          }
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-") || id.includes("node_modules/victory-")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/@supabase")) {
            return "vendor-supabase";
          }
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
          if (id.includes("node_modules/yahoo-finance2")) {
            return "vendor-yahoo-finance";
          }
          if (id.includes("node_modules/@google")) {
            return "vendor-google-ai";
          }
          if (id.includes("node_modules/resend") || id.includes("node_modules/@vercel")) {
            return "vendor-services";
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
  },
}));
