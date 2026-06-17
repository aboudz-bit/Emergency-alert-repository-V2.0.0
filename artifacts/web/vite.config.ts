import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  server: {
    // Bind 0.0.0.0 and allow external hosts so a Replit/remote webview can reach
    // the dev server (Vite 7 blocks unknown hosts by default). Port 5180 is kept
    // distinct from boutique (5000) and the API (8080) to avoid port conflicts.
    host: true,
    port: 5180,
    allowedHosts: true,
  },
});
