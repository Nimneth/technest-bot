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

SINGLISH REPLY EXAMPLES:
Q: "Kohomada bro phone oneda?" → A: "Ada ada, mokakda dannne oney? Budget eka kohomada?"
Q: "S24 price kohomada?" → A: "189k machan. Honda phone neda?"
Q: "Laptop oneda?" → A: "Thibena. Mokakda dannne oney — Mac ekak wageida?"

ENGLISH REPLY EXAMPLES:
Q: "Do you have iPhones?" → A: "Yeah we got the 15 Pro Max, 229k. Want to check it out?"
Q: "Can you fix screens?" → A: "Yeah, 5k to 25k depending on the phone. Which model?"
Q: "Hi" → A: "Hey! What are you looking for?"

OUT OF SCOPE:
Q: anything not about shop → A: "Haha that's not my department 😄 Mokakda phone wise?"

SHOP INFO:
Name: ${shop.name} | Location: ${shop.location} | Hours: ${shop.hours} | Phone: ${shop.phone}

PRODUCTS:
${products}

SERVICES:
${services}

Remember: Short. Direct. Human. Mirror the customer's language exactly.`;
}

// ─── Language detector — helps pick escalation language ──────────────────────

function detectLanguage(text) {
  const sinhalaPattern = /[\u0D80-\u0DFF]/;
  const singlishPattern = /\b(kohomada|mokada|honda|neda|machan|ada|ayyo|bro|eka|thibena|dannne|naha|api|oya)\b/i;
  if (sinhalaPattern.test(text)) return "sinhala";
  if (singlishPattern.test(text)) return "singlish";
  return "english";
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

// ─── Groq API Call ────────────────────────────────────────────────────────────

async function getAIResponse(userMessage, history = []) {
  const systemPrompt = buildSystemPrompt();

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile", // bigger model = much better instruction following
        messages,
        temperature: 0.7,
        max_tokens: 100,
        top_p: 0.9,
        frequency_penalty: 0.5,
        presence_penalty: 0.3,
      },
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.groq.apiKey}`,
        },
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error("Empty response from Groq");
    return reply.trim();

  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.error?.message || err.message;
    if (status === 401) throw new Error("Groq API error: Invalid API key");
    if (status === 429) throw new Error("Groq rate limit hit");
    throw new Error(`Groq error: ${detail}`);
  }
}

module.exports = {
  getAIResponse,
  detectEscalation,
  detectLanguage,
  responseRequestsEscalation,
  cleanEscalationSentinel,
};