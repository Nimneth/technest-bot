// src/index.js
// Entry point — sets up Express, middleware, routes, and starts server

require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const config = require("./config");

const webhookRouter = require("./routes/webhook");
const adminRouter = require("./routes/admin");

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging (skip in test)
if (config.server.env !== "test") {
  app.use(morgan(config.server.env === "production" ? "combined" : "dev"));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/webhook", webhookRouter);
app.use("/admin", adminRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "TechNest WhatsApp AI Chatbot",
    model: config.ollama.model,
    env: config.server.env,
    uptime: process.uptime().toFixed(1) + "s",
  });
});

// 404
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Global error handler
app.use((err, req, res, _next) => {
  console.error("💥 Unhandled error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(config.server.port, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   🤖  TechNest WhatsApp AI Chatbot            ║
╠═══════════════════════════════════════════════╣
║  Status  : ONLINE                             ║
║  Port    : ${String(config.server.port).padEnd(35)}║
║  Model   : ${config.ollama.model.padEnd(35)}║
║  Env     : ${config.server.env.padEnd(35)}║
╠═══════════════════════════════════════════════╣
║  Webhook : POST /webhook                      ║
║  Admin   : GET  /admin                        ║
║  Health  : GET  /health                       ║
╚═══════════════════════════════════════════════╝
  `);
});

module.exports = app;
