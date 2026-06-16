import express, { type Express } from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import accountabilityRouter from "./routes/accountability";
import keasRouter from "./routes/keas";

const app: Express = express();

app.use(cors());

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/accountability", accountabilityRouter);
app.use("/api/keas", keasRouter);

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
