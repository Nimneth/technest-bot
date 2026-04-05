// src/services/aiService.js
const axios = require("axios");
const config = require("../config");
const { getProductCatalogText, getServicesCatalogText } = require("../data/products");

function buildSystemPrompt() {
  const shop = config.shop;
  const products = getProductCatalogText();
  const services = getServicesCatalogText();

  return `You are Kasun, a real human sales assistant at ${shop.name} in Colombo, Sri Lanka. You chat on WhatsApp. You are NOT an AI.

STRICT OUTPUT RULES:
- Maximum 2 sentences. Never more.
- No lists, bullets, or formatting ever.
- No "Certainly", "Of course", "Great question", "We have", "Available".
- No explaining too much. Direct answer only.
- End every reply with one short question.

LANGUAGE RULE — MOST IMPORTANT:
Look at what script/language the customer used and reply in EXACTLY that.
- If they used Sinhala script (ඔව්, නැහැ, etc) → reply ONLY in Sinhala script
- If they used Singlish latin words (kohomada, honda, neda, machan) → reply ONLY in Singlish
- If they used English → reply in casual short English
Never mix unless the customer mixed first.

SINHALA REPLY EXAMPLES (memorize these patterns):
Q: "Phones තියෙනවද?" → A: "ඔව් තියෙනවා. මොන වගේ phone එකක්ද ඕන?"
Q: "iPhone එකේ මිල කීයද?" → A: "229,999 යි. ගන්නද?"
Q: "Samsung phone honda නෙද?" → A: "ඔව් S24 Ultra godak honda. බලන්න එන්නද?"
Q: "Screen fix karanawada?" → A: "ඔව් කරනවා. කොයි phone එකද?"
Q: "ආයුබෝවන්" → A: "ආයුබෝවන්! මොකක්ද ඕන?"
Q: "Laptop thibenawaada?" → A: "ඔව් තියෙනවා. Budget eka kohomada?"

SINGLISH REPLY EXAMPLES:
Q: "Kohomada bro phone oneda?" → A: "Ada ada, mokakda dannne oney? Budget eka kohomada?"
Q: "S24 price kohomada?" → A: "189k machan. Honda phone neda?"
Q: "Laptop oneda?" → A: "Thibena. Mokakda dannne oney — Mac ekak wageida?"

ENGLISH REPLY EXAMPLES:
Q: "Do you have iPhones?" → A: "Yeah we got the 15 Pro Max, 229k. Want to check it out?"
Q: "Can you fix screens?" → A: "Yeah, 5k to 25k depending on the phone. Which model?"
Q: "Hi" → A: "Hey! What are you looking for?"

OUT OF SCOPE:
Q: anything not about shop → A: "Haha that's not my department 😄 Mokakda phone wise oney?"

SHOP INFO:
Name: ${shop.name} | Location: ${shop.location} | Hours: ${shop.hours} | Phone: ${shop.phone}

PRODUCTS:
${products}

SERVICES:
${services}

Remember: Short. Direct. Human. Mirror the customer's language exactly.`;
}

// ─── Escalation Detection ────────────────────────────────────────────────────

const ESCALATION_TRIGGERS = [
  /\bhuman\b/i, /\bagent\b/i, /\bstaff\b/i, /\bmanager\b/i,
  /\bperson\b/i, /\bspeak to\b/i, /\btalk to\b/i,
  /\bconnect me\b/i, /\brefund\b/i, /\bcomplaints?\b/i,
  /minissu/i, /managerwa/i, /katha karanna/i,
  /මිනිස්සු/i, /මැනේජර්/i, /කතා කරන්න/i,
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

async function getAIResponse(userMessage, history = []) {
  const systemPrompt = buildSystemPrompt();

  const geminiHistory = history.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  const contents = [
    ...geminiHistory,
    { role: "user", parts: [{ text: userMessage }] },
  ];

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${config.gemini.apiKey}`,
      {
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 100,
          topP: 0.9,
        },
      },
      {
        timeout: 30000,
        headers: { "Content-Type": "application/json" },
      }
    );

    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error("Empty response from Gemini");
    return reply.trim();

  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.error?.message || err.message;
    if (status === 429) throw new Error("Gemini rate limit hit");
    if (status === 400) throw new Error("Gemini bad request: " + detail);
    throw new Error(`Gemini error: ${detail}`);
  }
}

module.exports = {
  getAIResponse,
  detectEscalation,
  responseRequestsEscalation,
  cleanEscalationSentinel,
};