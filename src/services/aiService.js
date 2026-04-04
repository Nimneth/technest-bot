// src/services/aiService.js
// Core AI logic: builds system prompt, calls Google Gemini API, returns response

const axios = require("axios");
const config = require("../config");
const { getProductCatalogText, getServicesCatalogText } = require("../data/products");

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildSystemPrompt() {
  const shop = config.shop;
  const products = getProductCatalogText();
  const services = getServicesCatalogText();

  return `
You are TechBot, the AI sales assistant for ${shop.name}.
You are friendly, professional, and highly knowledgeable about the shop's products and services.

═══════════════════════════════════════════
SHOP INFORMATION
═══════════════════════════════════════════
Name:     ${shop.name}
Address:  ${shop.location}
Phone:    ${shop.phone}
WhatsApp: ${shop.whatsapp}
Email:    ${shop.email}
Hours:    ${shop.hours}
Website:  ${shop.website}

═══════════════════════════════════════════
PRODUCT CATALOG (with prices in LKR)
═══════════════════════════════════════════
${products}

═══════════════════════════════════════════
REPAIR & SERVICES
═══════════════════════════════════════════
${services}

═══════════════════════════════════════════
YOUR STRICT RULES
═══════════════════════════════════════════
1. ONLY answer questions related to:
   - Products and their prices, specs, stock availability
   - Repair and device services offered
   - Shop location, hours, contact info
   - Order/purchase process at the shop
   - Warranty and after-sales support
   - General gadget/tech advice that helps a purchase decision

2. If asked about ANYTHING unrelated to the shop or gadgets (politics, cooking,
   writing code, general knowledge, etc.), respond EXACTLY:
   "I'm only able to help with questions about TechNest Gadget Shop — products,
   pricing, services, and repairs. Is there anything about our gadgets I can help you with? 😊"

3. PRICING: Always quote prices in LKR. Be upfront about prices.

4. STOCK: If a product shows stock > 0, say it's available. If stock is 0, say "currently out of stock."

5. Be concise. Use bullet points for specs. Use emojis sparingly but warmly.
6. Never make up products, prices, or policies not listed above.
7. For comparisons, be honest and helpful — guide the customer to the best fit.
8. Always end uncertain answers with: "Would you like me to confirm this with our team?"
`.trim();
}

// ─── Escalation Detection ────────────────────────────────────────────────────

const ESCALATION_TRIGGERS = [
  /\bhuman\b/i,
  /\bagent\b/i,
  /\bstaff\b/i,
  /\bmanager\b/i,
  /\bperson\b/i,
  /\bsomeone\b/i,
  /\bspeak to\b/i,
  /\btalk to\b/i,
  /\bchat with\b/i,
  /\bconnect me\b/i,
  /\btransfer me\b/i,
  /\breal person\b/i,
  /\bhuman agent\b/i,
  /\blive agent\b/i,
  /\blive support\b/i,
  /\brefund\b/i,
  /\bcomplaints?\b/i,
  /\bescalate\b/i,
  /\bnot (helpful|helping|working)\b/i,
];

function detectEscalation(message) {
  return ESCALATION_TRIGGERS.some((re) => re.test(message));
}

function responseRequestsEscalation(response) {
  return response.includes("ESCALATE_TO_HUMAN");
}

function cleanEscalationSentinel(response) {
  return response.replace("ESCALATE_TO_HUMAN", "").trim();
}

// ─── Gemini API Call ──────────────────────────────────────────────────────────

/**
 * Send a prompt + history to Gemini and get a response
 * @param {string} userMessage
 * @param {{ role: string, content: string }[]} history
 * @returns {Promise<string>}
 */
async function getAIResponse(userMessage, history = []) {
  const systemPrompt = buildSystemPrompt();

  // Convert history to Gemini format
  const geminiHistory = history.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  // Build contents array: history + new user message
  const contents = [
    ...geminiHistory,
    { role: "user", parts: [{ text: userMessage }] },
  ];

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${config.gemini.apiKey}`,
      {
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 512,
          topP: 0.9,
        },
      },
      {
        timeout: 30000,
        headers: { "Content-Type": "application/json" },
      }
    );

    const reply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) throw new Error("Empty response from Gemini");
    return reply.trim();

  } catch (err) {
    if (err.response?.status === 400) {
      throw new Error("Gemini API error: Invalid request — check your API key");
    }
    if (err.response?.status === 429) {
      throw new Error("Gemini API rate limit hit — try again in a moment");
    }
    throw new Error(`Gemini error: ${err.message}`);
  }
}

module.exports = {
  getAIResponse,
  detectEscalation,
  responseRequestsEscalation,
  cleanEscalationSentinel,
};
