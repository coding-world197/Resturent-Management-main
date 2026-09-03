import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/",
  plugins: [
    {
      name: "clean-route-tree-js",
      enforce: "pre",
      transform(code, id) {
        if (id.replace(/\\/g, "/").includes("src/routeTree.gen.js")) {
          return {
            code: code.replace(/import\s+type\s+[\s\S]*$/, ""),
            map: null,
          };
        }
      },
    },
    react(),
    tailwindcss(),
    {
      name: "dev-api-middleware",
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (!req.url?.startsWith('/api/')) return next();
          try {
            const urlPath = new URL(req.url, 'http://localhost').pathname;
            const apiPath = urlPath.replace(/^\/api/, '');
            const cleanPath = apiPath.replace(/^\/+/, '');
            const handlerPath = require('path').join(__dirname, 'api', `${cleanPath}.js`);
            const handlerModule = await import(pathToFileURL(handlerPath).href);
            const handler = handlerModule.default;
            const shimRes = {
              status(code) { res.statusCode = code; return this; },
              json(data) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data)); },
              setHeader: res.setHeader.bind(res),
              end: res.end.bind(res),
            };
            await handler(req, shimRes);
          } catch (e) {
            console.error('API handler error:', e);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envPrefix: ["VITE_", "ADMIN_", "SESSION_", "NEXT_PUBLIC_"],
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});