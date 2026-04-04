// src/index.js
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

if (config.server.env !== "test") {
  app.use(morgan(config.server.env === "production" ? "combined" : "dev"));
}

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/webhook", webhookRouter);
app.use("/admin", adminRouter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "TechNest WhatsApp AI Chatbot",
    ai: "Google Gemini 1.5 Flash",
    env: config.server.env,
    uptime: process.uptime().toFixed(1) + "s",
  });
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

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
║  AI      : Google Gemini 1.5 Flash            ║
║  Env     : ${config.server.env.padEnd(35)}║
╠═══════════════════════════════════════════════╣
║  Webhook : POST /webhook                      ║
║  Admin   : GET  /admin                        ║
║  Health  : GET  /health                       ║
╚═══════════════════════════════════════════════╝
  `);
});

module.exports = app;