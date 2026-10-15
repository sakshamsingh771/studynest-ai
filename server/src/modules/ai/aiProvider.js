// aiProvider — the ONLY file in the app that imports the OpenAI SDK.
// Same principle as storageService: swap models/providers here, nothing
// upstream (ai.service.js, controllers) needs to change.
const OpenAI = require("openai");
const env = require("../../config/env");
const AppError = require("../../utils/AppError");

let client = null;
function getClient() {
  if (!env.openaiApiKey) {
    throw new AppError(
      "AI features aren't configured yet. Add OPENAI_API_KEY to server/.env to enable them.",
      503,
      "AI_NOT_CONFIGURED"
    );
  }
  // Bounded timeout + retries so a slow provider can't hang a request forever.
  if (!client) client = new OpenAI({ apiKey: env.openaiApiKey, timeout: 45_000, maxRetries: 2 });
  return client;
}

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

// Turns raw provider failures into honest, safe errors (no keys / internals leaked).
function mapProviderError(err) {
  if (err instanceof AppError) return err;
  const status = err?.status;
  if (status === 429) return new AppError("The AI provider is rate-limited or out of quota. Please try again later.", 503, "AI_PROVIDER_QUOTA");
  if (status === 401) return new AppError("The AI provider rejected the configured credentials.", 503, "AI_NOT_CONFIGURED");
  if (err?.name === "APIConnectionTimeoutError" || err?.code === "ETIMEDOUT") return new AppError("The AI provider timed out. Please try again.", 504, "AI_TIMEOUT");
  return new AppError("The AI provider is currently unavailable. Please try again.", 502, "AI_PROVIDER_ERROR");
}

async function chatComplete({ system, user, jsonMode = false, temperature = 0.4 }) {
  const openai = getClient();
  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature,
      ...(jsonMode && { response_format: { type: "json_object" } }),
    });
    return {
      text: response.choices[0].message.content,
      tokensUsed: response.usage?.total_tokens ?? 0,
      model: CHAT_MODEL,
    };
  } catch (err) {
    throw mapProviderError(err);
  }
}

async function embed(text) {
  const [v] = await embedMany([text]);
  return v;
}

// One API call per batch instead of one per chunk — much faster uploads processing.
async function embedMany(texts, batchSize = 64) {
  const openai = getClient();
  const out = [];
  try {
    for (let i = 0; i < texts.length; i += batchSize) {
      const response = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: texts.slice(i, i + batchSize) });
      out.push(...response.data.map((d) => d.embedding));
    }
  } catch (err) {
    throw mapProviderError(err);
  }
  return out;
}

module.exports = { chatComplete, embed, embedMany, CHAT_MODEL };
