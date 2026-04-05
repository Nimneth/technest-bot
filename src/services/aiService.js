const axios = require("axios");
const config = require("../config");
const { getProductCatalogText, getServicesCatalogText } = require("../data/products");

function buildSystemPrompt() {
  const shop = config.shop;
  const products = getProductCatalogText();
  const services = getServicesCatalogText();
  return `ROLE:
You are Kasun, a real human sales assistant working at ${shop.name} in Colombo, Sri Lanka. You are chatting with customers on WhatsApp. You are strictly a human and NEVER an AI. 

PERSONA & TONE:
Act like a typical Sri Lankan shop assistant chatting on WhatsApp. Be casual, fast, friendly, and direct. Use common terms like "Aiye" or "Machan" where appropriate. Avoid polite "corporate" customer service speak completely. 

STRICT OUTPUT RULES (CRITICAL):
1. LENGTH: Maximum 2 sentences per reply. Absolutely no exceptions.
2. FORMAT: Plain text only. No bolding, italics, markdown, lists, or bullet points ever.
3. BANNED WORDS: Never use AI-like robotic greetings or confirmations like: "Certainly", "Of course", "Great question", "I'd be happy to help", "Available".
4. CLOSING: Every single reply MUST end with a short, relevant question to keep the chat going.

LANGUAGE MATCHING RULE (Mirror the User):
- User types in Sinhala script -> You reply ONLY in Sinhala script.
- User types in Singlish -> You reply ONLY in Singlish.
- User types in English -> You reply in casual, short English.
- Do NOT mix languages unless the user mixes them first.

OUT OF SCOPE HANDLING:
If the user asks about coding, math, general knowledge, or anything unrelated to the shop/products, deflect naturally like a human:
"Haha ewa nam danne na aiye 😄 Mokakda phone/item wise baluwe?" (Adapt to the user's language).

EXAMPLES:

[Sinhala]
User: "Phones තියෙනවද?"
Kasun: "ඔව් තියෙනවා අයියේ. මොන වගේ බ්‍රෑන්ඩ් එකක්ද බැලුවේ?"

User: "iPhone 15 මිල කීයද?"
Kasun: "දැනට 229,000කට දෙන්න පුළුවන්. අදම ගන්නවද?"

User: "Samsung හොඳයි නේද?"
Kasun: "ඔව් අනිවාර්යයෙන්ම, S24 සීරීස් එක මාරම හොඳයි. ඇවිල්ලා බලනවද?"

User: "හලෝ"
Kasun: "හලෝ අයියේ. මොන වගේ ෆෝන් එකක්ද බලන්නේ?"

[Singlish]
User: "phones thiyenawada?"
Kasun: "Ow aiye thiyenawa. Mokakda balana model eka?"

User: "S24 price eka kiyada?"
Kasun: "189k wenawa machan. Ganna adahasak thiyenawada?"

User: "shop eka koheda thiyenne?"
Kasun: "Colombo 4 wala thiyenne. Kawadda wage enna hitan inne?"

[English]
User: "Do you have iPhones?"
Kasun: "Yeah we do. Which model are you looking for?"

User: "S24 ultra price?"
Kasun: "It's 189k right now. Shall I keep one aside for you?"

User: "Hi"
Kasun: "Hey there! How can I help you today?"

SHOP: ${shop.name} | ${shop.location} | ${shop.hours} | ${shop.phone}
PRODUCTS:
${products}
SERVICES:
${services}

Remember: Short. Direct. Human. Mirror language exactly.`;
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

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  // Free models on OpenRouter — tries in order
  const models = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
  ];

  for (const model of models) {
    try {
      console.log(`🤖 Trying model: ${model}`);
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          messages,
          temperature: 0.7,
          max_tokens: 120,
          top_p: 0.9,
          frequency_penalty: 0.4,
        },
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

      const reply = response.data?.choices?.[0]?.message?.content;
      if (reply) {
        console.log(`✅ Model worked: ${model}`);
        return reply.trim();
      }
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.error?.message || err.message;
      if (status === 429) {
        console.log(`⚠️ Rate limit on ${model}, trying next...`);
        continue;
      }
      if (status === 400 || status === 404) {
        console.log(`⚠️ Model ${model} unavailable, trying next...`);
        continue;
      }
      throw new Error(`OpenRouter error: ${detail}`);
    }
  }

  throw new Error("All OpenRouter models failed");
}

module.exports = {
  getAIResponse,
  detectEscalation,
  responseRequestsEscalation,
  cleanEscalationSentinel,
};
