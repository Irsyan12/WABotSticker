require("dotenv").config();
const axios = require("axios");

const API_ENDPOINT = (process.env.API_ENDPOINT || "").replace(/\/$/, "");
const VENUS_CONNECT_API_KEY = process.env.VENUS_CONNECT_API_KEY;

const http = axios.create({
  baseURL: API_ENDPOINT || "http://localhost",
  timeout: 30000,
  headers: {
    "x-api-key": VENUS_CONNECT_API_KEY || "",
    "Content-Type": "application/json",
  },
});

function ensureConfigured() {
  if (!API_ENDPOINT) {
    throw new Error("API_ENDPOINT belum diatur di .env");
  }
  if (!VENUS_CONNECT_API_KEY) {
    throw new Error("VENUS_CONNECT_API_KEY belum diatur di .env");
  }
}

function isGroupJid(value) {
  return typeof value === "string" && value.endsWith("@g.us");
}

function toPhoneNumber(value) {
  if (typeof value !== "string") return value;
  return value.replace("@c.us", "").replace("@s.whatsapp.net", "").trim();
}

async function sendTextMessage(sessionId, recipient, message) {
  ensureConfigured();
  if (isGroupJid(recipient)) {
    return http.post(`/session/${sessionId}/send-group`, {
      groupId: recipient,
      message,
    });
  }

  return http.post(`/session/${sessionId}/send`, {
    to: toPhoneNumber(recipient),
    message,
  });
}

async function sendMediaMessage(sessionId, recipient, media, message = "") {
  ensureConfigured();
  const mediaPayload = Array.isArray(media) ? media : [media];

  if (isGroupJid(recipient)) {
    return http.post(`/session/${sessionId}/send-group`, {
      groupId: recipient,
      message,
      media: mediaPayload,
    });
  }

  return http.post(`/session/${sessionId}/send`, {
    to: toPhoneNumber(recipient),
    message,
    media: mediaPayload,
  });
}

function pickFirstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function parseIncomingMessage(payload) {
  if (!payload || typeof payload !== "object") return null;

  const event =
    payload.event ||
    payload.type ||
    payload?.data?.event ||
    payload?.data?.type ||
    "";

  if (
    event &&
    ![
      "message.received",
      "message",
      "messages.upsert",
      "incoming.message",
    ].includes(event)
  ) {
    return null;
  }

  const data = payload.data || payload.payload || payload;
  const message = data.message || data;

  const from = pickFirstString(
    message.from,
    data.from,
    message.chatId,
    message.groupId,
    data.chatId,
    data.groupId,
    payload.from,
  );

  if (!from) return null;

  const body = pickFirstString(
    message.body,
    message.text,
    data.body,
    data.text,
  );
  const caption = pickFirstString(
    message.caption,
    message?.media?.caption,
    data.caption,
  );

  const mediaSource = pickFirstString(
    message.media,
    message.mediaUrl,
    message.url,
    message?.media?.url,
    message?.media?.path,
    data.media,
    data.mediaUrl,
    data.url,
    data?.media?.url,
    data?.media?.path,
  );

  return {
    from,
    isGroup: Boolean(message.isGroup || data.isGroup || isGroupJid(from)),
    body,
    caption,
    commandText: body || caption,
    mediaSource,
    raw: payload,
  };
}

module.exports = {
  sendTextMessage,
  sendMediaMessage,
  parseIncomingMessage,
};
