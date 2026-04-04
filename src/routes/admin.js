// src/routes/admin.js
// Simple admin API for monitoring the chatbot (no auth needed for dev; add JWT for prod)

const express = require("express");
const router = express.Router();
const { getHistory, clearHistory, getActiveUsers } = require("../services/historyService");
const { products, services } = require("../data/products");
const config = require("../config");

// GET /admin  — status overview
router.get("/", (req, res) => {
  const activeUsers = getActiveUsers();
  res.json({
    status: "online",
    shop: config.shop.name,
    model: config.ollama.model,
    activeConversations: activeUsers.length,
    activeUsers,
    timestamp: new Date().toISOString(),
  });
});

// GET /admin/history/:phone  — view a user's chat history
router.get("/history/:phone", (req, res) => {
  const history = getHistory(req.params.phone);
  res.json({ phone: req.params.phone, messages: history, count: history.length });
});

// DELETE /admin/history/:phone  — clear a user's chat history
router.delete("/history/:phone", (req, res) => {
  clearHistory(req.params.phone);
  res.json({ success: true, message: `History cleared for ${req.params.phone}` });
});

// GET /admin/products  — view product catalog
router.get("/products", (req, res) => {
  res.json({ count: products.length, products });
});

// GET /admin/services  — view services
router.get("/services", (req, res) => {
  res.json({ count: services.length, services });
});

module.exports = router;
