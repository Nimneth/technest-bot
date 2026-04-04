// src/utils/logger.js
// Minimal structured logger with timestamps

const config = require("../config");

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const currentLevel = config.server.env === "production" ? 2 : 3;

function format(level, message, meta) {
  const ts = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : "";
  return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

const logger = {
  error: (msg, meta) => { if (LEVELS.error <= currentLevel) console.error(format("error", msg, meta)); },
  warn:  (msg, meta) => { if (LEVELS.warn  <= currentLevel) console.warn(format("warn",  msg, meta)); },
  info:  (msg, meta) => { if (LEVELS.info  <= currentLevel) console.log(format("info",  msg, meta)); },
  debug: (msg, meta) => { if (LEVELS.debug <= currentLevel) console.log(format("debug", msg, meta)); },
};

module.exports = logger;
