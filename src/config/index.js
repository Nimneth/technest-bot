require("dotenv").config();
const config = {
  server: { port: parseInt(process.env.PORT) || 3000, env: process.env.NODE_ENV || "development" },
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "technest_verify_2024",
    apiVersion: process.env.WHATSAPP_API_VERSION || "v25.0",
    get apiUrl() { return `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`; },
  },
  openrouter: { apiKey: process.env.OPENROUTER_API_KEY },
  admin: { phoneNumber: process.env.ADMIN_PHONE_NUMBER },
  chat: {
    historyStorage: process.env.HISTORY_STORAGE || "memory",
    historyFilePath: "./logs/chat_history.json",
    maxHistoryPerUser: 20,
    maxTurnsBeforeEscalation: 10,
  },
  shop: {
    name: "TechNest Gadget Shop",
    location: "123 Galle Road, Colombo 03, Sri Lanka",
    phone: "+94 11 234 5678",
    whatsapp: "+94 77 234 5678",
    email: "hello@technest.lk",
    hours: "Mon-Sat: 9AM-8PM | Sun: 10AM-6PM",
    website: "www.technest.lk",
  },
};
module.exports = config;
