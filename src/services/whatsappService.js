// src/services/whatsappService.js
// Handles all outbound WhatsApp Cloud API calls

const axios = require("axios");
const config = require("../config");

// ─── Shared HTTP client ───────────────────────────────────────────────────────

const waClient = axios.create({
  baseURL: `https://graph.facebook.com/${config.whatsapp.apiVersion}`,
  headers: {
    Authorization: `Bearer ${config.whatsapp.token}`,
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// ─── Send text message ────────────────────────────────────────────────────────

/**
 * Send a plain text WhatsApp message
 * @param {string} to   - recipient's phone number (e.g. "94771234567")
 * @param {string} text - message body
 */
async function sendTextMessage(to, text) {
  if (!config.whatsapp.token || !config.whatsapp.phoneNumberId) {
    console.log(`[DEV MODE] Would send to ${to}: ${text}`);
    return { status: "dev_mode" };
  }

  try {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body: text, preview_url: false },
    };

    const res = await waClient.post(
      `/${config.whatsapp.phoneNumberId}/messages`,
      payload
    );

    console.log(`✅  Message sent to ${to} | MsgID: ${res.data?.messages?.[0]?.id}`);
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.error?.message || err.message;
    console.error(`❌  Failed to send message to ${to}: ${detail}`);
    throw new Error(`WhatsApp send error: ${detail}`);
  }
}

// ─── Mark message as read ─────────────────────────────────────────────────────

/**
 * Mark an incoming message as read (shows double blue ticks)
 * @param {string} messageId
 */
async function markAsRead(messageId) {
  if (!config.whatsapp.token || !config.whatsapp.phoneNumberId) return;

  try {
    await waClient.post(`/${config.whatsapp.phoneNumberId}/messages`, {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    });
  } catch {
    // Non-critical — don't throw
  }
}

// ─── Admin escalation notification ───────────────────────────────────────────

/**
 * Notify the admin WhatsApp number when a user requests escalation
 * @param {string} userPhone
 * @param {string} lastMessage
 */
async function notifyAdmin(userPhone, lastMessage) {
  if (!config.admin.phoneNumber) {
    console.log(`[ADMIN ALERT] Escalation from ${userPhone}: "${lastMessage}"`);
    return;
  }

  const adminText =
    `🚨 *Escalation Alert — TechNest Bot*\n\n` +
    `👤 Customer: +${userPhone}\n` +
    `💬 Last message: "${lastMessage}"\n\n` +
    `Please follow up as soon as possible.`;

  try {
    await sendTextMessage(config.admin.phoneNumber, adminText);
    console.log(`🔔  Admin notified about escalation from ${userPhone}`);
  } catch (err) {
    console.error(`⚠️  Failed to notify admin: ${err.message}`);
  }
}

// ─── Parse incoming webhook message ──────────────────────────────────────────

/**
 * Extract structured message data from a WhatsApp webhook payload
 * @param {object} body - raw webhook body
 * @returns {{ phoneNumber, messageId, text, type, name } | null}
 */
function parseIncomingMessage(body) {
  try {
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    // Ignore status updates (delivered, read receipts)
    if (value?.statuses) return null;

    const message = value?.messages?.[0];
    if (!message) return null;

    const contact = value?.contacts?.[0];

    return {
      phoneNumber: message.from,          // sender's number
      messageId: message.id,
      type: message.type,                  // text, image, audio, etc.
      text: message.type === "text" ? message.text?.body : null,
      name: contact?.profile?.name || "Customer",
      timestamp: message.timestamp,
    };
  } catch {
    return null;
  }
}

module.exports = { sendTextMessage, markAsRead, notifyAdmin, parseIncomingMessage };
