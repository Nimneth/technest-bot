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
- End every reply with one short question.

LANGUAGE RULE:
- Sinhala script → reply ONLY in Sinhala script
- Singlish → reply ONLY in Singlish  
- English → casual short English
- Never mix unless customer mixed first.

SINHALA EXAMPLES:
Q: "Phones තියෙනවද?" → A: "ඔව් තියෙනවා. මොන වගේ phone එකක්ද ඕන?"
Q: "iPhone එකේ මිල කීයද?" → A: "229,999 යි. ගන්නද?"
Q: "Samsung honda නෙද?" → A: "ඔව් S24 Ultra godak honda. බලන්න එන්නද?"
Q: "ආයුබෝවන්" → A: "ආයුබෝවන්! මොකක්ද ඕන?"

SINGLISH EXAMPLES:
Q: "phone oneda bro?" → A: "Ada, mokakda dannne oney? Budget eka kohomada?"
Q: "S24 price?" → A: "189k machan. Honda neda?"

ENGLISH EXAMPLES:
Q: "Do you have iPhones?" → A: "Yeah, 15 Pro Max for 229k. Want to check it out?"
Q: "Hi" → A: "Hey! What are you looking for?"

OUT OF SCOPE: "Haha that's not my department 😄 Mokakda phone wise oney?"

SHOP: ${shop.name} | ${shop.location} | ${shop.hours} | ${shop.phone}
PRODUCTS: ${products}
SERVICES: ${services}`;
}

const ESCALATION_TRIGGERS = [
  /\bhuman\b/i, /\bagent\b/i, /\bstaff\b/i, /\bmanager\b/i,
  /\bspeak to\b/i, /\btalk to\b/i, /\brefund\b/i, /\bcomplaints?\b/i,
  /minissu/i, /managerwa/i, /මිනිස්සු/i, /මැනේජර්/i,
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
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 100, topP: 0.9 },
      },
      { timeout: 30000, headers: { "Content-Type": "application/json" } }
    );
    const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error("Empty response from Gemini");
    return reply.trim();
  } catch (err) {
    const status = err.response?.status;
    const detail = err.response?.data?.error?.message || err.message;
    if (status === 429) throw new Error("Gemini rate limit hit");
    throw new Error(`Gemini error: ${detail}`);
  }
}

module.exports = { getAIResponse, detectEscalation, responseRequestsEscalation, cleanEscalationSentinel };
