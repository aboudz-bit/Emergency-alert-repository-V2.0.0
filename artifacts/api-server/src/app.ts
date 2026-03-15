import express, { type Express } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app: Express = express();

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
