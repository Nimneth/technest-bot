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
- No "Certainly", "Of course", "Great question".
- End every reply with one short question.

LANGUAGE RULE:
- Sinhala script → reply ONLY in Sinhala
- Singlish → reply ONLY in Singlish
- English → casual short English
- Never mix unless customer mixed first.

SINHALA EXAMPLES:
Q: "Phones තියෙනවද?" → A: "ඔව් තියෙනවා. මොන වගේ phone එකක්ද ඕන?"
Q: "iPhone මිල කීයද?" → A: "229,999 යි. ගන්නද?"
Q: "ආයුබෝවන්" → A: "ආයුබෝවන්! මොකක්ද ඕන?"
Q: "Screen fix karanawada?" → A: "ඔව් කරනවා. කොයි phone එකද?"

SINGLISH EXAMPLES:
Q: "phone oneda?" → A: "Ada, mokakda dannne oney? Budget eka kohomada?"
Q: "S24 price?" → A: "189k machan. Honda neda?"

ENGLISH EXAMPLES:
Q: "Do you have iPhones?" → A: "Yeah, 15 Pro Max for 229k. Want to check it out?"
Q: "Hi" → A: "Hey! What are you looking for?"

OUT OF SCOPE: "Haha not my area 😄 Mokakda phone wise oney?"

SHOP: ${shop.name} | ${shop.location} | ${shop.hours} | ${shop.phone}
PRODUCTS:
${products}
SERVICES:
${services}`;
}

const ESCALATION_TRIGGERS = [
  /\bhuman\b/i, /\bagent\b/i, /\bstaff\b/i, /\bmanager\b/i,
  /\bspeak to\b/i, /\btalk to\b/i, /\brefund\b/i, /\bcomplaints?\b/i,
  /minissu/i, /managerwa/i, /\u0db8\u0dd2\u0db1\u0dd2\u0dc3\u0dca\u0dc3\u0dd4/,
];

function detectEscalation(message) {
  return ESCALATION_TRIGGERS.some((re) => re.test(message));
}
function responseRequestsEscalation(r) { return r.includes("ESCALATE_TO_HUMAN"); }
function cleanEscalationSentinel(r) { return r.replace("ESCALATE_TO_HUMAN", "").trim(); }

async function getAIResponse(userMessage, history = []) {
  const messages = [
    { role: "system", content: buildSystemPrompt() },
    ...history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
    { role: "user", content: userMessage },
  ];

  // openrouter/free auto-picks best available free model
  const models = [
    "openrouter/auto",
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-r1:free",
    "google/gemma-3-27b-it:free",
  ];

  for (const model of models) {
    try {
      console.log(`Trying: ${model}`);
      const res = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        { model, messages, temperature: 0.7, max_tokens: 120, frequency_penalty: 0.4 },
        {
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.openrouter.apiKey}`,
            "HTTP-Referer": "https://technest.lk",
            "X-Title": "TechNest WhatsApp Bot",
          },
        }
      );
      const reply = res.data?.choices?.[0]?.message?.content;
      if (reply) { console.log(`Used: ${model}`); return reply.trim(); }
    } catch (err) {
      console.log(`Failed ${model}: ${err.response?.status} ${err.response?.data?.error?.message || err.message}`);
      if (err.response?.status === 401) throw new Error("OpenRouter: Invalid API key");
      continue;
    }
  }
  throw new Error("All models failed");
}

module.exports = { getAIResponse, detectEscalation, responseRequestsEscalation, cleanEscalationSentinel };
