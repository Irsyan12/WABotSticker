const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const moment = require("moment-timezone");
const colors = require("colors");
const fs = require("fs");

// Sistem limit stiker per user/grup
const stickerLimit = {};
const LIMIT_COUNT = 10;
const LIMIT_WINDOW = 60 * 60 * 1000; // 1 jam dalam ms

const client = new Client({
  restartOnAuthFail: true,
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2403.2.html",
  },
  ffmpeg: "./ffmpeg.exe",
  authStrategy: new LocalAuth({ clientId: "client" }),
});
const config = require("./config/config.json");

client.on("qr", (qr) => {
  console.log(
    `[${moment().tz(config.timezone).format("HH:mm:ss")}] Scan the QR below : `,
  );
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.clear();
  const consoleText = "./config/console.txt";
  fs.readFile(consoleText, "utf-8", (err, data) => {
    if (err) {
      console.log(
        `[${moment().tz(config.timezone).format("HH:mm:ss")}] Console Text not found!`
          .yellow,
      );
      console.log(
        `[${moment().tz(config.timezone).format("HH:mm:ss")}] ${config.name} is Already!`
          .green,
      );
    } else {
      console.log(data.green);
      console.log(
        `[${moment().tz(config.timezone).format("HH:mm:ss")}] ${config.name} is Already!`
          .green,
      );
    }
  });
});

client.on("message", async (message) => {
  const isGroups = message.from.endsWith("@g.us") ? true : false;
  if ((isGroups && config.groups) || !isGroups) {
    // Ping command
    if (message.body === `${config.prefix}ping`) {
      client.sendMessage(message.from, "🫷 Iziin!");
      return;
    }
    if (message.body === `${config.prefix}help`) {
      client.sendMessage(
        message.from,
        "*[📌] Daftar Perintah :*\n\n*1.* `!ping` - Untuk mengecek bot aktif atau tidak\n*2.* `!stc` - Untuk mengubah gambar/video/gif menjadi stiker (Otomatis & Keterangan)\n*3.* `!stc` - Untuk mengubah gambar menjadi stiker dengan membalas gambar\n*4.* `!image` - Untuk mengubah stiker menjadi gambar dengan membalas stiker\n\n*[❗] Catatan :*\n- Jangan spam plis, server gratisan nih",
      );
      return;
    }
    // Image to Sticker (Caption Command Only)
    if (
      (message.type == "image" ||
        message.type == "video" ||
        message.type == "gif") &&
      message._data &&
      message._data.caption === `${config.prefix}stc`
    ) {
      // Limit per user/grup
      const key = message.from;
      const now = Date.now();
      if (!stickerLimit[key]) {
        stickerLimit[key] = [];
      }
      // Hapus request yang sudah lewat 1 jam
      stickerLimit[key] = stickerLimit[key].filter(
        (ts) => now - ts < LIMIT_WINDOW,
      );
      if (stickerLimit[key].length >= LIMIT_COUNT) {
        client.sendMessage(
          message.from,
          "❌ Limit stiker tercapai, tunggu 1 jam lagi.",
        );
        return;
      }
      stickerLimit[key].push(now);
      if (config.log)
        console.log(
          `[${"!".red}] ${message.from.replace("@c.us", "").yellow} created sticker`,
        );
      //   client.sendMessage(message.from, "*[⏳]* Loading..");
      try {
        const media = await message.downloadMedia();
        client
          .sendMessage(message.from, media, {
            sendMediaAsSticker: true,
            stickerName: config.name, // Sticker Name = Edit in 'config/config.json'
            stickerAuthor: config.author, // Sticker Author = Edit in 'config/config.json'
          })
          .then(() => {
            // client.sendMessage(message.from, "*[✅]* Successfully!");
          });
      } catch {
        client.sendMessage(message.from, "❌ Gagal cuk, Sabar yee!");
      }

      // Image to Sticker (With Reply Image)
    } else if (message.body === `${config.prefix}stc`)  {
      // Limit per user/grup
      const key = message.from;
      const now = Date.now();
      if (!stickerLimit[key]) {
        stickerLimit[key] = [];
      }
      stickerLimit[key] = stickerLimit[key].filter(
        (ts) => now - ts < LIMIT_WINDOW,
      );
      if (stickerLimit[key].length >= LIMIT_COUNT) {
        client.sendMessage(
          message.from,
          "❌ Limit stiker tercapai, tunggu 1 jam lagi.",
        );
        return;
      }
      stickerLimit[key].push(now);
      if (config.log)
        console.log(
          `[${"!".red}] ${message.from.replace("@c.us", "").yellow} created sticker`,
        );
      const quotedMsg = await message.getQuotedMessage();
      if (message.hasQuotedMsg && quotedMsg.hasMedia) {
        // client.sendMessage(message.from, "*[⏳]* Loading..");
        try {
          const media = await quotedMsg.downloadMedia();
          client
            .sendMessage(message.from, media, {
              sendMediaAsSticker: true,
              stickerName: config.name, // Sticker Name = Edit in 'config/config.json'
              stickerAuthor: config.author, // Sticker Author = Edit in 'config/config.json'
            })
            .then(() => {
              //   client.sendMessage(message.from, "*[✅]* Successfully!");
            });
        } catch {
          client.sendMessage(message.from, "❌ Gagal cuk, Sabar yee!");
        }
      } else {
        client.sendMessage(message.from, "*[❎]* Reply Image First!");
      }

      // Sticker to Image (Auto)
    } else if (message.type == "sticker" && message._data && message._data.caption === `${config.prefix}image`) {
      if (config.log)
        console.log(
          `[${"!".red}] ${message.from.replace("@c.us", "").yellow} convert sticker into image`,
        );
      //   client.sendMessage(message.from, "*[⏳]* Loading..");
      try {
        const media = await message.downloadMedia();
        client.sendMessage(message.from, media).then(() => {
          //   client.sendMessage(message.from, "*[✅]* Successfully!");
        });
      } catch {
        client.sendMessage(message.from, "❌ Gagal cuk, Sabar yee!");
      }

      // Sticker to Image (With Reply Sticker)
    } else if (message.body == `${config.prefix}image`) {
      if (config.log)
        console.log(
          `[${"!".red}] ${message.from.replace("@c.us", "").yellow} convert sticker into image`,
        );
      const quotedMsg = await message.getQuotedMessage();
      if (message.hasQuotedMsg && quotedMsg.hasMedia) {
        // client.sendMessage(message.from, "*[⏳]* Loading..");
        try {
          const media = await quotedMsg.downloadMedia();
          client.sendMessage(message.from, media).then(() => {
            // client.sendMessage(message.from, "*[✅]* Successfully!");
          });
        } catch {
          client.sendMessage(message.from, "❌ Gagal cuk, Sabar yee!");
        }
      } else {
        client.sendMessage(message.from, "*[❎]* Reply Sticker First!");
      }

      // Claim or change sticker name and sticker author
    } else if (message.body.startsWith(`${config.prefix}change`)) {
      if (config.log)
        console.log(
          `[${"!".red}] ${message.from.replace("@c.us", "").yellow} change the author name on the sticker`,
        );
      if (message.body.includes("|")) {
        let name = message.body
          .split("|")[0]
          .replace(message.body.split(" ")[0], "")
          .trim();
        let author = message.body.split("|")[1].trim();
        const quotedMsg = await message.getQuotedMessage();
        if (message.hasQuotedMsg && quotedMsg.hasMedia) {
          //   client.sendMessage(message.from, "*[⏳]* Loading..");
          try {
            const media = await quotedMsg.downloadMedia();
            client
              .sendMessage(message.from, media, {
                sendMediaAsSticker: true,
                stickerName: name,
                stickerAuthor: author,
              })
              .then(() => {
                // client.sendMessage(message.from, "*[✅]* Successfully!");
              });
          } catch {
            client.sendMessage(message.from, "❌ Gagal cuk, Sabar yee!");
          }
        } else {
          client.sendMessage(message.from, "*[❎]* Reply Sticker First!");
        }
      } else {
        client.sendMessage(
          message.from,
          `*[❎]* Run the command :\n*${config.prefix}change <name> | <author>*`,
        );
      }

      // Read chat
    } else {
      client.getChatById(message.id.remote).then(async (chat) => {
        await chat.sendSeen();
      });
    }
  }
});

console.log("Trying to connect...");
client.initialize();
