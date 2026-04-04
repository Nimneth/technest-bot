// src/services/chatbotService.js
// Orchestrates: parse → history → AI → escalation check → reply

const { getHistory, addMessage, getTurnCount } = require("./historyService");
const { getAIResponse, detectEscalation, responseRequestsEscalation, cleanEscalationSentinel } = require("./aiService");
const { sendTextMessage, markAsRead, notifyAdmin } = require("./whatsappService");
const config = require("../config");

// Track which users are currently escalated (avoid duplicate admin alerts)
const escalatedUsers = new Set();

/**
 * Process an incoming WhatsApp message end-to-end
 * @param {{ phoneNumber, messageId, text, name }} message
 */
async function handleIncomingMessage(message) {
  const { phoneNumber, messageId, text, name } = message;

  // ── 1. Acknowledge receipt (mark as read) ──────────────────────────────────
  await markAsRead(messageId);

  // ── 2. Guard: only handle text messages ────────────────────────────────────
  if (!text) {
    await sendTextMessage(
      phoneNumber,
      "👋 Hi! I can only process text messages right now. " +
        "Please type your question about our products or services."
    );
    return;
  }

  console.log(`\n📨  [${phoneNumber}] ${name}: "${text}"`);

  // ── 3. Pre-check: user-side escalation keywords (code-level, bypasses AI) ──
  if (detectEscalation(text)) {
    await handleEscalation(phoneNumber, text);
    return;
  }

  // ── 4. Load conversation history ───────────────────────────────────────────
  const history = getHistory(phoneNumber);


  // ── 5. Suggest escalation if conversation is very long ────────────────────
  const turnCount = getTurnCount(phoneNumber);
  if (turnCount >= config.chat.maxTurnsBeforeEscalation && !escalatedUsers.has(phoneNumber)) {
    await sendTextMessage(
      phoneNumber,
      "💬 It looks like we've been chatting for a while! " +
        "Would you prefer to speak with one of our team members directly? " +
        "Just say *\"speak to a person\"* and I'll connect you right away. 😊"
    );
  }

  // ── 6. Save user message to history ───────────────────────────────────────
  addMessage(phoneNumber, "user", text);

  // ── 7. Get AI response ─────────────────────────────────────────────────────
  let aiReply;
  try {
    aiReply = await getAIResponse(text, history);
  } catch (err) {
    console.error(`⚠️  AI error for ${phoneNumber}:`, err.message);
    await sendTextMessage(
      phoneNumber,
      "⚠️ I'm having a technical issue right now. " +
        "Please try again in a moment, or call us at " + config.shop.phone
    );
    return;
  }

  // ── 8. Check if AI itself triggered escalation ────────────────────────────
  if (responseRequestsEscalation(aiReply)) {
    const cleanReply = cleanEscalationSentinel(aiReply);
    await sendTextMessage(phoneNumber, cleanReply);
    await handleEscalation(phoneNumber, text, true); // skip second message
    addMessage(phoneNumber, "assistant", cleanReply);
    return;
  }

  // ── 9. Save assistant reply & send ────────────────────────────────────────
  addMessage(phoneNumber, "assistant", aiReply);
  await sendTextMessage(phoneNumber, aiReply);

  console.log(`🤖  [${phoneNumber}] Bot: "${aiReply.slice(0, 80)}..."`);
}

/**
 * Handle escalation: notify admin + send user confirmation
 * @param {string} phoneNumber
 * @param {string} triggerMessage
 * @param {boolean} alreadyReplied - if AI already sent the escalation reply
 */
async function handleEscalation(phoneNumber, triggerMessage, alreadyReplied = false) {
  if (!alreadyReplied) {
    await sendTextMessage(
      phoneNumber,
      "👋 No problem! I'm connecting you with one of our TechNest team members. " +
        "Someone will reach out to you shortly. Thank you for your patience! 🙏"
    );
  }

  if (!escalatedUsers.has(phoneNumber)) {
    escalatedUsers.add(phoneNumber);
    await notifyAdmin(phoneNumber, triggerMessage);

    // Auto-remove from escalated set after 30 minutes
    setTimeout(() => escalatedUsers.delete(phoneNumber), 30 * 60 * 1000);
  }

  console.log(`🚨  Escalation triggered for ${phoneNumber}`);
}

module.exports = { handleIncomingMessage };
