// src/config/index.js
require("dotenv").config();

const config = {
  server: {
    port: parseInt(process.env.PORT) || 3000,
    env: process.env.NODE_ENV || "development",
  },

  whatsapp: {
    token: process.env.WHATSAPP_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "technest_verify_2024",
    apiVersion: process.env.WHATSAPP_API_VERSION || "v25.0",
    get apiUrl() {
      return `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
    },
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
  },

  admin: {
    phoneNumber: process.env.ADMIN_PHONE_NUMBER,
  },

  chat: {
    historyStorage: process.env.HISTORY_STORAGE || "memory",
    historyFilePath: "./logs/chat_history.json",
    maxHistoryPerUser: 20,
    maxTurnsBeforeEscalation: parseInt(process.env.MAX_TURNS_BEFORE_SUGGEST_ESCALATION) || 10,
  },

  shop: {
    name: "TechNest Gadget Shop",
    location: "123 Galle Road, Colombo 03, Sri Lanka",
    phone: "+94 11 234 5678",
    whatsapp: "+94 77 234 5678",
    email: "hello@technest.lk",
    hours: "Mon–Sat: 9:00 AM – 8:00 PM | Sun: 10:00 AM – 6:00 PM",
    website: "www.technest.lk",
  },
};

// Validate required env vars in production
if (config.server.env === "production") {
  const required = ["WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "GEMINI_API_KEY"];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`❌  Missing required env var: ${key}`);
      process.exit(1);
    }
  }
}

module.exports = config;
