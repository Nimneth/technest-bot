# 🤖 TechNest WhatsApp AI Chatbot

A production-ready WhatsApp AI chatbot for a gadget shop, powered by **Ollama + Mistral** (local LLM) and the **WhatsApp Cloud API**.

---

## 📁 Project Structure

```
whatsapp-ai-chatbot/
├── src/
│   ├── index.js                  # Express app entry point
│   ├── config/
│   │   └── index.js              # Centralised config (reads .env)
│   ├── routes/
│   │   ├── webhook.js            # WhatsApp webhook (verify + receive)
│   │   └── admin.js              # Admin API endpoints
│   ├── services/
│   │   ├── aiService.js          # Ollama/Mistral integration + system prompt
│   │   ├── whatsappService.js    # Send messages, parse incoming, notify admin
│   │   ├── chatbotService.js     # Orchestrates the full message pipeline
│   │   └── historyService.js     # Per-user chat history (memory or file)
│   ├── data/
│   │   └── products.js           # Mock product catalog + pricing
│   └── utils/
│       ├── logger.js             # Simple structured logger
│       └── testAI.js             # CLI test runner for the AI
├── logs/                         # Auto-created; stores chat_history.json if file mode
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `3000` |
| `WHATSAPP_TOKEN` | Meta permanent access token | `EAABsb...` |
| `WHATSAPP_PHONE_NUMBER_ID` | Your WhatsApp Business phone number ID | `12345678901` |
| `WHATSAPP_VERIFY_TOKEN` | A secret string you choose for webhook setup | `my_secret_token_123` |
| `WHATSAPP_API_VERSION` | Meta Graph API version | `v19.0` |
| `OLLAMA_BASE_URL` | Ollama server URL | `http://localhost:11434` |
| `OLLAMA_MODEL` | LLM model name | `mistral` |
| `ADMIN_PHONE_NUMBER` | WhatsApp number to notify on escalation | `94771234567` |
| `HISTORY_STORAGE` | `memory` or `file` | `memory` |

---

## 🚀 Setup Guide (Step by Step)

### Step 1 — Install Node.js (v18+)

```bash
# Check version
node --version

# Install via nvm if needed
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
nvm install 18
nvm use 18
```

### Step 2 — Install Ollama

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows: download installer from https://ollama.com/download
```

### Step 3 — Pull the Mistral model

```bash
ollama pull mistral
```

This downloads ~4GB. Run once.

### Step 4 — Start Ollama

```bash
ollama serve
```

Keep this running in a separate terminal. It listens on `http://localhost:11434`.

### Step 5 — Clone and install dependencies

```bash
git clone <your-repo-url>
cd whatsapp-ai-chatbot
npm install
```

### Step 6 — Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

For local testing you don't need WhatsApp tokens yet — the bot runs in **dev mode** and just logs messages to the console.

### Step 7 — Run the server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

You should see:
```
╔═══════════════════════════════════════════════╗
║   🤖  TechNest WhatsApp AI Chatbot            ║
╠═══════════════════════════════════════════════╣
║  Status  : ONLINE                             ║
║  Port    : 3000                               ║
║  Model   : mistral                            ║
╚═══════════════════════════════════════════════╝
```

### Step 8 — Test the AI (without WhatsApp)

```bash
npm test
```

This runs a set of sample questions through the AI and prints responses.

---

## 📱 WhatsApp Cloud API Setup

### 8.1 Create a Meta Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new app → select **Business**
3. Add the **WhatsApp** product to your app
4. Under **WhatsApp > API Setup**, copy your:
   - **Temporary or Permanent Access Token**
   - **Phone Number ID**

### 8.2 Register Webhook

1. In Meta Developer Console → **WhatsApp > Configuration > Webhook**
2. Set:
   - **Callback URL**: `https://yourdomain.com/webhook`
   - **Verify Token**: same value as `WHATSAPP_VERIFY_TOKEN` in your `.env`
3. Subscribe to: `messages`

### 8.3 Expose local server (for development)

Use **ngrok** to create a public HTTPS tunnel to your local server:

```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000
```

Use the generated `https://xxxx.ngrok.io` URL as your webhook callback URL.

---

## 🛠 API Endpoints

### Webhook (WhatsApp)

| Method | Path | Description |
|---|---|---|
| `GET` | `/webhook` | Meta webhook verification |
| `POST` | `/webhook` | Receives incoming WhatsApp messages |

### Admin

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin` | Overview: active users, model, status |
| `GET` | `/admin/history/:phone` | View a user's chat history |
| `DELETE` | `/admin/history/:phone` | Clear a user's chat history |
| `GET` | `/admin/products` | Full product catalog |
| `GET` | `/admin/services` | Services catalog |

### Health

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Server health check |

---

## 🎯 Features

### ✅ Product Q&A
The bot answers questions about all products in the catalog, including specs, pricing, and availability.

### ✅ Pricing
All prices are stored in `src/data/products.js` as mock JSON. Update this file to change pricing — no AI retraining needed.

### ✅ Escalation Detection
The bot detects when a user wants a human agent via:
- Keywords: "human", "agent", "staff", "speak to someone", etc.
- Frustrated tone: repetition, all-caps
- Explicit requests: "refund", "complaint"

When triggered, it:
1. Sends the user a friendly handoff message
2. Sends an admin WhatsApp notification with the user's number and last message
3. Prevents duplicate alerts for 30 minutes

### ✅ Chat History
- **Memory mode** (default): Fast, no disk I/O, cleared on server restart
- **File mode**: Persists to `logs/chat_history.json` across restarts. Set `HISTORY_STORAGE=file`

### ✅ Out-of-scope blocking
The AI is strictly prompted to only answer shop-related queries. Off-topic questions get a polite redirect.

---

## 🔧 Customisation

### Change the shop details
Edit `src/config/index.js` → `config.shop`

### Update products / pricing
Edit `src/data/products.js` — add, remove, or update items in the `products` array.

### Change the AI model
Update `OLLAMA_MODEL` in `.env`. Any model supported by Ollama works:
```bash
ollama pull llama3       # Meta LLaMA 3
ollama pull phi3         # Microsoft Phi-3 (lighter)
ollama pull gemma2       # Google Gemma 2
```

### Tune the AI behaviour
Edit `buildSystemPrompt()` in `src/services/aiService.js` to:
- Add more products
- Change the tone
- Add FAQ answers
- Add more escalation triggers

---

## 🔒 Production Checklist

- [ ] Use a **permanent** WhatsApp access token (not the 24hr temp token)
- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Add auth middleware to `/admin` routes (e.g. API key header check)
- [ ] Use `HISTORY_STORAGE=file` or upgrade to Redis for persistence
- [ ] Deploy behind HTTPS (Nginx + Let's Encrypt, or a cloud platform)
- [ ] Set up process management: `pm2 start src/index.js --name technest-bot`
- [ ] Monitor Ollama RAM usage (~4–6GB for Mistral)

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 |
| AI Model | Mistral via Ollama |
| WhatsApp API | Meta WhatsApp Cloud API |
| Storage | In-memory / JSON file |
| HTTP Client | Axios |
| Dev Tools | Nodemon, Morgan |

---

## 💡 Example Conversations

**Product inquiry:**
> User: Do you have any Apple laptops?
> Bot: Yes! We carry the **MacBook Air M3** (LKR 299,999) — 13.6" Liquid Retina, M3 chip, 8GB RAM, 256GB SSD, 18hr battery, with 1 year Apple warranty. Currently in stock (5 units). Would you like to know more?

**Out-of-scope:**
> User: Can you write me a poem?
> Bot: I'm only able to help with questions about TechNest Gadget Shop — products, pricing, services, and repairs. Is there anything about our gadgets I can help you with? 😊

**Escalation:**
> User: I want to speak to a real person
> Bot: No problem! I'm connecting you with one of our TechNest team members. Someone will reach out to you shortly. Thank you for your patience! 🙏
> [Admin receives WhatsApp notification]
