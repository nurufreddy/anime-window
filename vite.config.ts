import { defineConfig } from "vite";
import { createReadStream, existsSync } from "node:fs";
import { resolve, sep } from "node:path";
const headers = {
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "require-corp",
};
export default defineConfig({
  // MediaPipe dynamically imports its loader. Serve vendor assets verbatim,
  // including Vite's ?import suffix, just like the production static server.
  plugins: [
    {
      name: "local-vendor-assets",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = new URL(req.url ?? "/", "http://localhost");
          if (!url.pathname.startsWith("/vendor/")) return next();
          const root = resolve("public/vendor"),
            path = resolve("public", `.${url.pathname}`);
          if (!path.startsWith(root + sep) || !existsSync(path)) return next();
          res.setHeader(
            "Content-Type",
            path.endsWith(".wasm") ? "application/wasm" : "text/javascript",
          );
          for (const [key, value] of Object.entries(headers))
            res.setHeader(key, value);
          createReadStream(path).pipe(res);
        });
      },
    },
  ],
  worker: { format: "es" },
  server: { headers },
  preview: { headers },
});
