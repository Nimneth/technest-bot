require("dotenv").config();
const express = require("express");
const config = require("./config");
const webhookRouter = require("./routes/webhook");
const adminRouter = require("./routes/admin");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/webhook", webhookRouter);
app.use("/admin", adminRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "TechNest Bot", ai: "OpenRouter" });
});

app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, _next) => res.status(500).json({ error: "Server error" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`TechNest Bot running on port ${PORT}`);
});

module.exports = app;
