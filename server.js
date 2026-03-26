const express = require("express");
const cors = require("cors");
const QRCode = require("qrcode");
const { Client, LocalAuth } = require("whatsapp-web.js");

const app = express();

app.use(cors());
app.use(express.json());

let qrCodeBase64 = null;
let whatsappStatus = "starting";

const client = new Client({
  authStrategy: new LocalAuth({
    clientId: "reativazap"
  }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  }
});

client.on("qr", async (qr) => {
  whatsappStatus = "qr_ready";
  qrCodeBase64 = await QRCode.toDataURL(qr);
  console.log("QR Code gerado");
});

client.on("ready", () => {
  whatsappStatus = "ready";
  qrCodeBase64 = null;
  console.log("WhatsApp conectado");
});

client.on("authenticated", () => {
  whatsappStatus = "authenticated";
});

client.on("disconnected", () => {
  whatsappStatus = "disconnected";
});

client.initialize();

app.get("/", (req, res) => {
  res.send("ReativaZap API rodando 🚀");
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    app: "ReativaZap",
    status: "online",
    whatsapp: whatsappStatus
  });
});

app.get("/whatsapp/qr", (req, res) => {
  if (!qrCodeBase64) {
    return res.send("QR ainda não gerado ou já conectado");
  }

  res.send(`<img src="${qrCodeBase64}" />`);
});

app.get("/whatsapp/status", (req, res) => {
  res.json({ whatsapp: whatsappStatus });
});

app.post("/whatsapp/send", async (req, res) => {
  const { number, message } = req.body;

  try {
    await client.sendMessage(`${number}@c.us`, message);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor rodando");
});
