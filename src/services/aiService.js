// src/services/aiService.js
const axios = require("axios");
const config = require("../config");
const { getProductCatalogText, getServicesCatalogText } = require("../data/products");

function detectLanguageStyle(text) {
  const hasSinhalaUnicode = /[\u0D80-\u0DFF]/.test(text);
  const hasLatinSinhala =
    /\b(kohomada|machan|neda|honda|mokada|oyata|kiyada|thiyenawada|balanna|anna|awilla|awa|set\w*)\b/i.test(text);

  if (hasSinhalaUnicode) return "sinhala_unicode";
  if (hasLatinSinhala) return "singlish";
  return "english";
}

function buildSystemPrompt(userMessage = "") {
  const shop = config.shop;
  const products = getProductCatalogText();
  const services = getServicesCatalogText();
  const style = detectLanguageStyle(userMessage);

  const styleRules = {
    sinhala_unicode: `
Reply in Sinhala unicode only.
Use natural Sri Lankan customer-service Sinhala.
Do NOT use transliterated English like "phones eka thiyenawada".
Start with a direct answer first.
Ask only one short follow-up question at the end.
`,
    singlish: `
Reply in Singlish only.
Use natural WhatsApp Sinhala-English mix.
Do NOT sound formal or scripted.
Start with a direct answer first.
Ask only one short follow-up question at the end.
`,
    english: `
Reply in casual short English only.
Sound like a real WhatsApp sales assistant.
Start with a direct answer first.
Ask only one short follow-up question at the end.
`,
  };

  return `
You are Kasun, a real human sales assistant working at ${shop.name} in Sri Lanka.
You are chatting on WhatsApp.
Never say you are AI, bot, assistant, model, or system.

IMPORTANT BEHAVIOR:
${styleRules[style]}

ABSOLUTE RULES:
- Maximum 2 short sentences.
- No bullets, no lists, no numbering.
- No long explanations.
- No “Certainly”, “Of course”, “Great question”, “Sure thing”.
- Do not mention multiple products unless the customer asks for options.
- If the user asks something simple like availability, answer simply and humanly.
- Never echo the user's wording awkwardly.
- Ask only one short question at the end.
- Use product names only when needed.
- Prices only in LKR, casually written.
- If you do not know, say "ටිකක් check කරලා කියන්නම්" or "let me check that".

HOW TO SOUND HUMAN:
- Answer the question first.
- Keep it warm, short, and natural.
- Prefer simple words over fancy words.
- Use one relevant product or one relevant service only.

GOOD EXAMPLES:

Customer: Phones තියෙනවද?
Reply: ඔව් තියෙනවා. මොන වගේ phone එකක්ද ඕන? iPhone එකක් වගේද බලන්නෙ?

Customer: iPhone 15 price?
Reply: iPhone 15 එක 229,999 යි. බලන්න එන්නද?

Customer: Screen repair කරනවද?
Reply: ඔව් කරනවා. මොන model එකද?

Customer: Hi
Reply: හෙලෝ! මොකක්ද ඕන?

SHOP:
Name: ${shop.name}
Address: ${shop.location}
Phone: ${shop.phone}
Hours: ${shop.hours}
Website: ${shop.website}

PRODUCTS:
${products}

SERVICES:
${services}
`.trim();
}

function detectEscalation(message) {
  const ESCALATION_TRIGGERS = [
    /\bhuman\b/i, /\bagent\b/i, /\bstaff\b/i, /\bmanager\b/i,
    /\bperson\b/i, /\bsomeone\b/i, /\bspeak to\b/i, /\btalk to\b/i,
    /\bconnect me\b/i, /\btransfer me\b/i, /\bhuman agent\b/i,
    /\brefund\b/i, /\bcomplaints?\b/i, /\bescalate\b/i,
    /minissu/i, /minissa/i, /katha karanna/i, /managerwa/i,
  ];
  return ESCALATION_TRIGGERS.some((re) => re.test(message));
}

function looksTooRobotic(text) {
  return [
    /phones? eka thiyenawada/i,
    /kohomada phone eka/i,
    /great question/i,
    /certainly/i,
    /of course/i,
    /\bAs an AI\b/i,
    /\bI am a bot\b/i,
    /\blet me know if you need\b/i,
    /\bhere are\b/i,
    /\bwe have\b.*\bwe have\b/i,
  ].some((re) => re.test(text));
}

function cleanReply(text) {
  return text
    .replace(/\s+/g, " ")
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim();
}

async function getAIResponse(userMessage, history = []) {
  const systemPrompt = buildSystemPrompt(userMessage);

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  const payload = {
    model: "llama-3.1-8b-instant",
    messages,
    temperature: 0.25,
    top_p: 0.85,
    max_tokens: 70,
    frequency_penalty: 0.1,
    presence_penalty: 0.0,
  };

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      payload,
      {
        timeout: 30000,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.groq.apiKey}`,
        },
      }
    );

    let reply = response.data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error("Empty response from Groq");

    reply = cleanReply(reply);

    if (looksTooRobotic(reply)) {
      const repairPrompt = `
Rewrite this to sound like a real human WhatsApp sales reply.
Rules:
- Max 2 short sentences
- Use the same language style as the user
- Start with a direct answer
- End with one short question
- Do not sound scripted
- Do not mention multiple products unless necessary

Text:
${reply}
`.trim();

      const repairResponse = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You rewrite short WhatsApp sales replies." },
            { role: "user", content: repairPrompt },
          ],
          temperature: 0.15,
          max_tokens: 50,
          top_p: 0.8,
        },
        {
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.groq.apiKey}`,
          },
        }
      );

      const fixed = repairResponse.data?.choices?.[0]?.message?.content;
      if (fixed) reply = cleanReply(fixed);
    }

    return reply;
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
};