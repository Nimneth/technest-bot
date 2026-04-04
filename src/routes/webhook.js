// src/routes/webhook.js
// WhatsApp Cloud API webhook endpoint (verification + message handling)

const express = require("express");
const router = express.Router();
const config = require("../config");
const { parseIncomingMessage } = require("../services/whatsappService");
const { handleIncomingMessage } = require("../services/chatbotService");

// ─── GET /webhook  (Meta verification handshake) ──────────────────────────────
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.whatsapp.verifyToken) {
    console.log("✅  Webhook verified successfully");
    return res.status(200).send(challenge);
  }

  console.warn("⚠️  Webhook verification failed — token mismatch");
  return res.sendStatus(403);
});

// ─── POST /webhook  (Incoming messages) ──────────────────────────────────────
router.post("/", async (req, res) => {
  // Always respond 200 immediately — WhatsApp retries if it doesn't get a fast ack
  res.sendStatus(200);

  const body = req.body;

  // Validate it's a WhatsApp event
  if (body?.object !== "whatsapp_business_account") return;

  const message = parseIncomingMessage(body);
  if (!message) return; // status update, not a message

  // Process asynchronously (don't block the 200 response)
  handleIncomingMessage(message).catch((err) => {
    console.error(`❌  Error handling message from ${message.phoneNumber}:`, err.message);
  });
});

module.exports = router;
