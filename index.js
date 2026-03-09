require("dotenv").config();
const express = require("express");
const axios = require("axios");
const sharp = require("sharp");
const {
  sendTextMessage,
  sendMediaMessage,
  parseIncomingMessage,
} = require("./venusconnect");

const app = express();
app.use(express.json({ limit: "20mb" }));

const PREFIX = process.env.BOT_PREFIX || "!";
const SESSION_ID = process.env.VENUS_SESSION_ID;
const PORT = Number(process.env.PORT || 3000);
const GROUPS_ENABLED = String(process.env.GROUPS_ENABLED || "true") === "true";
const LIMIT_COUNT = Number(process.env.LIMIT_COUNT || 10);
const LIMIT_WINDOW = Number(process.env.LIMIT_WINDOW_MINUTES || 60) * 60 * 1000;

const stickerLimit = new Map();

function getLimitState(key) {
  const now = Date.now();
  const existing = stickerLimit.get(key) || [];
  const active = existing.filter((timestamp) => now - timestamp < LIMIT_WINDOW);
  stickerLimit.set(key, active);

  if (active.length >= LIMIT_COUNT) {
    const oldest = active[0];
    const waitMs = LIMIT_WINDOW - (now - oldest);
    const waitMin = Math.max(1, Math.ceil(waitMs / 60000));
    return { allowed: false, waitMin };
  }

  active.push(now);
  stickerLimit.set(key, active);
  return { allowed: true };
}

async function loadMediaBuffer(mediaSource) {
  if (!mediaSource || typeof mediaSource !== "string") {
    throw new Error("Media source tidak valid");
  }

  if (mediaSource.startsWith("data:")) {
    const base64 = mediaSource.split(",")[1] || "";
    return Buffer.from(base64, "base64");
  }

  const response = await axios.get(mediaSource, {
    responseType: "arraybuffer",
    timeout: 30000,
  });
  return Buffer.from(response.data);
}

async function convertToWebpDataUri(mediaSource) {
  const mediaBuffer = await loadMediaBuffer(mediaSource);
  const webpBuffer = await sharp(mediaBuffer, { animated: true })
    .webp({ quality: 80 })
    .toBuffer();
  return `data:image/webp;base64,${webpBuffer.toString("base64")}`;
}

async function onIncomingMessage(message) {
  if (!SESSION_ID) {
    console.error("VENUS_SESSION_ID belum diatur di .env");
    return;
  }

  if (!message.from) return;
  if (message.isGroup && !GROUPS_ENABLED) return;

  const command = (message.commandText || "").trim();

  if (command === `${PREFIX}ping`) {
    await sendTextMessage(SESSION_ID, message.from, "Pong! Server is running.");
    return;
  }

  if (command === `${PREFIX}help`) {
    await sendTextMessage(
      SESSION_ID,
      message.from,
      "*[📌] Daftar Perintah :*\n\n*1.* `!ping` - Cek bot aktif\n*2.* `!stc` - Kirim media dengan caption !stc untuk buat stiker\n\n*[❗] Catatan :*\n- Limit 10 stiker / 1 jam per chat",
    );
    return;
  }

  if (command !== `${PREFIX}stc`) return;

  if (!message.mediaSource) {
    await sendTextMessage(
      SESSION_ID,
      message.from,
      "❌ Kirim gambar dengan caption !stc untuk membuat stiker.",
    );
    return;
  }

  const limitState = getLimitState(message.from);
  if (!limitState.allowed) {
    await sendTextMessage(
      SESSION_ID,
      message.from,
      `❌ Limit stiker tercapai, coba lagi sekitar ${limitState.waitMin} menit lagi.`,
    );
    return;
  }

  try {
    const webpDataUri = await convertToWebpDataUri(message.mediaSource);
    await sendMediaMessage(SESSION_ID, message.from, [webpDataUri], "");
  } catch (error) {
    console.error("Sticker conversion error:", error.message);
    await sendTextMessage(
      SESSION_ID,
      message.from,
      "❌ Gagal convert media ke stiker. Pastikan media berupa gambar yang valid.",
    );
  }
}

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "stickerbot-venusconnect" });
});

app.post("/webhook", async (req, res) => {
  res.status(200).json({ ok: true });

  try {
    const incomingMessage = parseIncomingMessage(req.body);
    if (!incomingMessage) return;
    await onIncomingMessage(incomingMessage);
  } catch (error) {
    console.error("Webhook handling error:", error.message);
  }
});

app.listen(PORT, () => {
  console.log(`Venus sticker bot listening on port ${PORT}`);
});
