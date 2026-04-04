// src/utils/testAI.js
require("dotenv").config();
const { getAIResponse, detectEscalation } = require("../services/aiService");

const testMessages = [
  "Hi! What phones do you have?",
  "How much is the iPhone 15 Pro Max?",
  "Do you have any Samsung Galaxy phones?",
  "Can you fix my cracked screen?",
  "What's the capital of France?",
  "Do you offer any discounts?",
  "What are your shop hours?",
];

const escalationPhrases = [
  "I need to speak to a human agent",
  "Can I talk to a person?",
  "I want a refund",
  "connect me to staff",
  "I need a human",
  "let me speak to someone",
];

function runEscalationTests() {
  console.log("\n🚨  Escalation Keyword Detection (code-level, bypasses AI)");
  console.log("═".repeat(55));
  let passed = 0;
  for (const phrase of escalationPhrases) {
    const result = detectEscalation(phrase);
    const icon = result ? "✅ ESCALATES" : "❌ MISSED   ";
    console.log(`  ${icon} → "${phrase}"`);
    if (result) passed++;
  }
  console.log(`\n  Result: ${passed}/${escalationPhrases.length} triggers working`);
  console.log("═".repeat(55) + "\n");
}

async function runAITests() {
  console.log("🧪  AI Response Tests");
  console.log("═".repeat(55));

  for (const msg of testMessages) {
    console.log(`\n👤 USER: ${msg}`);
    console.log("─".repeat(40));
    try {
      const reply = await getAIResponse(msg, []);
      console.log(`🤖 BOT: ${reply}`);
    } catch (err) {
      console.error(`❌ ERROR: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\n" + "═".repeat(55));
  console.log("✅  All tests complete");
}

runEscalationTests();
runAITests();
