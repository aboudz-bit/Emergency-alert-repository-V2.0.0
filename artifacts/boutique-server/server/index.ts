import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import cors from "cors";
import path from "path";
import fs from "fs";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import { seedDatabase } from "./seed";

const SessionStore = MemoryStore(session);

const app = express();
const httpServer = createServer(app);

declare module "express-session" {
  interface SessionData {
    id: string;
  }
}

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "masah-boutique-secret",
    resave: false,
    saveUninitialized: true,
    store: new SessionStore({ checkPeriod: 86400000 }),
    cookie: { secure: false, maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse).substring(0, 200)}`;
      }
      log(logLine);
    }
  });

  next();
});

(async () => {
  await seedDatabase();
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (res.headersSent) return next(err);
    return res.status(status).json({ message });
  });

  const flutterBuildPath = path.resolve(import.meta.dirname, "..", "masah_boutique", "build", "web");
  if (fs.existsSync(flutterBuildPath)) {
    app.use(express.static(flutterBuildPath));
    app.use((_req, res) => {
      res.sendFile(path.resolve(flutterBuildPath, "index.html"));
    });
    log("Serving Flutter web build");
  } else {
    app.get("/", (_req, res) => {
      res.json({
        message: "Masah Boutique API - بوتيك ماسـة",
        instagram: "@masahboutique",
        endpoints: {
          products: "/api/products",
          cart: "/api/cart",
          orders: "/api/orders",
          stores: "/api/stores",
        }
      });
    });
    log("Flutter build not found, serving API only");
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen({ port, host: "0.0.0.0", reusePort: true }, () => {
    log(`Masah Boutique server running on port ${port}`);
  });
})();
