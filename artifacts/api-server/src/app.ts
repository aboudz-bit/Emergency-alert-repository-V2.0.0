import express, { type Express } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app: Express = express();

// ── Health-check routes served directly (no proxy dependency) ──
app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

// ── Proxy everything else to the boutique server ──
app.use(
  createProxyMiddleware({
    target: "http://localhost:5000",
    changeOrigin: true,
    on: {
      error: (err, _req, res: any) => {
        res.status(502).json({ message: "Boutique server unavailable" });
      },
    },
  })
);

export default app;
