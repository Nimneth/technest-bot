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
  res.json({ status: "ok", service: "TechNest WhatsApp AI Chatbot", ai: "Gemini 1.5 Pro", uptime: process.uptime().toFixed(1) + "s" });
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));
app.use((err, req, res, _next) => res.status(500).json({ error: "Internal server error" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🤖 TechNest Bot ONLINE | Port: ${PORT} | AI: Gemini 1.5 Pro`);
});

module.exports = app;
