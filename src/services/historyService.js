// src/services/historyService.js
// Manages per-user conversation history (in-memory + optional file persistence)

const fs = require("fs");
const path = require("path");
const config = require("../config");

// In-memory store: { phoneNumber: [ { role, content, timestamp } ] }
const memoryStore = {};

// ─── File helpers ────────────────────────────────────────────────────────────

function ensureLogDir() {
  const dir = path.dirname(config.chat.historyFilePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadFromFile() {
  try {
    ensureLogDir();
    if (!fs.existsSync(config.chat.historyFilePath)) return {};
    const raw = fs.readFileSync(config.chat.historyFilePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveToFile(store) {
  try {
    ensureLogDir();
    fs.writeFileSync(config.chat.historyFilePath, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error("⚠️  Could not save chat history to file:", err.message);
  }
}

// ─── Core API ────────────────────────────────────────────────────────────────

/**
 * Retrieve message history for a user as Ollama-compatible message array
 * @param {string} phoneNumber
 * @returns {{ role: string, content: string }[]}
 */
function getHistory(phoneNumber) {
  const store = config.chat.historyStorage === "file" ? loadFromFile() : memoryStore;
  return (store[phoneNumber] || []).map(({ role, content }) => ({ role, content }));
}

/**
 * Append a message to a user's history
 * @param {string} phoneNumber
 * @param {"user"|"assistant"} role
 * @param {string} content
 */
function addMessage(phoneNumber, role, content) {
  const store = config.chat.historyStorage === "file" ? loadFromFile() : memoryStore;

  if (!store[phoneNumber]) store[phoneNumber] = [];

  store[phoneNumber].push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });

  // Trim to max history window
  const max = config.chat.maxHistoryPerUser;
  if (store[phoneNumber].length > max) {
    store[phoneNumber] = store[phoneNumber].slice(-max);
  }

  if (config.chat.historyStorage === "file") {
    saveToFile(store);
  } else {
    // memoryStore is mutated in place — nothing extra needed
  }
}

/**
 * Clear all history for a user (e.g. after escalation resolved)
 * @param {string} phoneNumber
 */
function clearHistory(phoneNumber) {
  if (config.chat.historyStorage === "file") {
    const store = loadFromFile();
    delete store[phoneNumber];
    saveToFile(store);
  } else {
    delete memoryStore[phoneNumber];
  }
}

/**
 * Get total turn count for a user
 * @param {string} phoneNumber
 * @returns {number}
 */
function getTurnCount(phoneNumber) {
  return getHistory(phoneNumber).length;
}

/**
 * Get all users with active sessions (for admin dashboard)
 * @returns {string[]}
 */
function getActiveUsers() {
  const store = config.chat.historyStorage === "file" ? loadFromFile() : memoryStore;
  return Object.keys(store);
}

module.exports = { getHistory, addMessage, clearHistory, getTurnCount, getActiveUsers };
