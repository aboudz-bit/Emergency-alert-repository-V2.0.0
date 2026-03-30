const { getDefaultConfig } = require("expo/metro-config");
const { createProxyMiddleware } = require("http-proxy-middleware");

const config = getDefaultConfig(__dirname);

config.server = config.server || {};
const originalMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = originalMiddleware ? originalMiddleware(middleware, server) : middleware;
  const connect = require("connect");
  const app = connect();

  app.use("/api", createProxyMiddleware({
    target: "http://localhost:8080",
    changeOrigin: true,
  }));

  app.use(enhanced);
  return app;
};

module.exports = config;
