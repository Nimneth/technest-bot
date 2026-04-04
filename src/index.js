require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const config = require("./config");

const webhookRouter = require("./routes/webhook");
const adminRouter = require("./routes/admin");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/webhook", webhookRouter);
app.use("/admin", adminRouter);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "TechNest WhatsApp AI Chatbot",
    ai: "Groq Llama3",
    env: config.server.env,
    uptime: process.uptime().toFixed(1) + "s",
  });
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, req, res, _next) => {
  console.error("Error:", err.message);
  res.status(500).json({ error: "Internal server error" });
});

// Railway sets PORT automatically — always use process.env.PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║   🤖  TechNest WhatsApp AI Chatbot            ║
╠═══════════════════════════════════════════════╣
║  Status  : ONLINE                             ║
║  Port    : ${String(PORT).padEnd(35)}║
║  AI      : Groq Llama3-8b-instant             ║
╠═══════════════════════════════════════════════╣
║  Webhook : POST /webhook                      ║
║  Admin   : GET  /admin                        ║
║  Health  : GET  /health                       ║
╚═══════════════════════════════════════════════╝
  `);
});

module.exports = app;
