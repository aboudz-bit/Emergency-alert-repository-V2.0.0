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
    // Replit/preview-ready: bind 0.0.0.0 so the external webview can reach the
    // dev server, serve on Replit's webview port (5000), and allow the Replit
    // *.replit.dev preview host (Vite 7 blocks unknown hosts by default).
    host: true,
    port: 5000,
    strictPort: true,
    allowedHosts: true,
  },
});
