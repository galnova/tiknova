const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { WebcastPushConnection } = require("tiktok-live-connector");
const { exec } = require("child_process");
const player = require("play-sound")();

process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = "true";

// --- Config ---
let TTS_VOICE = "Microsoft Zira Desktop"; // 👩 Female by default
// Other option: "Microsoft David Desktop" (👨 Male)

// --- Helpers ---
let speechQueue = [];
let isSpeaking = false;

function speak(text) {
  return new Promise((resolve) => {
    exec(
      `powershell -Command "Add-Type –AssemblyName System.Speech; ` +
        `$speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; ` +
        `$speak.SelectVoice('${TTS_VOICE}'); ` +
        `$speak.Speak('${text}');"`,
      (err) => {
        if (err) console.error("TTS Error:", err);
        resolve();
      }
    );
  });
}

function playSound(file) {
  const fullPath = path.join(__dirname, file);
  return new Promise((resolve) => {
    player.play(fullPath, (err) => {
      if (err) console.error("Error playing sound:", err);
      resolve();
    });
  });
}

async function processQueue() {
  if (isSpeaking || speechQueue.length === 0) return;
  isSpeaking = true;

  const item = speechQueue.shift();

  if (item.startsWith("SOUND::")) {
    const file = item.split("::")[1];
    await playSound(file);
    await new Promise((r) => setTimeout(r, 1200));
  } else {
    await speak(item);
  }

  isSpeaking = false;
  processQueue();
}

function enqueueSpeech(text) {
  speechQueue.push(text);
  processQueue();
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "dist", "index.html"));
  }

  // --- TikTok Connection ---
  const username = "yoyo_savagemike"; // 👈 your TikTok username
  const tiktok = new WebcastPushConnection(username);

  tiktok.on("connected", (state) => {
    console.log("✅ Connected to TikTok room:", state.roomId);
    win.webContents.send("tiktok-status", { connected: true });
  });

  tiktok.on("disconnected", () => {
    console.log("⚠️ Disconnected from TikTok");
    win.webContents.send("tiktok-status", { connected: false });
  });

  // Chat
  tiktok.on("chat", (data) => {
    const name = data.nickname || data.uniqueId;
    const msg = `${name}: ${data.comment}`;
    win.webContents.send("tiktok-event", { msg, type: "chat" });

    enqueueSpeech(`${name} says ${data.comment}`);
  });

  // Like
  tiktok.on("like", (data) => {
    const msg = `${data.uniqueId} liked the stream (${data.likeCount} likes)`;
    win.webContents.send("tiktok-event", { msg, type: "like" });

    enqueueSpeech(`SOUND::sounds/like.mp3`);
  });

  // Follow
  tiktok.on("follow", (data) => {
    const msg = `${data.uniqueId} followed!`;
    win.webContents.send("tiktok-event", { msg, type: "follow" });

    enqueueSpeech(`SOUND::sounds/follow.mp3`);
  });

  // Gift
  tiktok.on("gift", (data) => {
    let msg = `${data.uniqueId} sent ${data.giftName}`;
    let soundFile = "sounds/small-gift.mp3";

    if (data.repeatEnd) {
      msg = `${data.uniqueId} sent a COMBO of ${data.giftName} x${data.repeatCount}`;
      soundFile = "sounds/multi-gift.mp3";
    } else if (data.diamondCount >= 100) {
      msg = `${data.uniqueId} sent a BIG gift: ${data.giftName}`;
      soundFile = "sounds/big-gift.mp3";
    }

    win.webContents.send("tiktok-event", { msg, type: "gift" });
    enqueueSpeech(`SOUND::${soundFile}`);
  });

  // ✅ Share
  tiktok.on("share", (data) => {
    const msg = `${data.uniqueId} shared the stream!`;
    win.webContents.send("tiktok-event", { msg, type: "share" });

    enqueueSpeech(`SOUND::sounds/share.mp3`);
  });

  // Connect
  tiktok.connect().catch((err) => {
    console.error("❌ Failed to connect:", err);
    const msg = `❌ Failed to connect: ${err.message || err}`;
    win.webContents.send("tiktok-event", { msg, type: "error" });
    win.webContents.send("tiktok-status", { connected: false });
  });
}

// --- IPC ---
ipcMain.on("play-sound", (_event, file) => {
  enqueueSpeech(`SOUND::${file}`);
});

ipcMain.on("speak-text", (_event, text) => {
  enqueueSpeech(text);
});

// ✅ Voice toggle
ipcMain.on("set-voice", (_event, voice) => {
  if (voice === "Zira") {
    TTS_VOICE = "Microsoft Zira Desktop";
  } else if (voice === "David") {
    TTS_VOICE = "Microsoft David Desktop";
  }
  console.log(`🔊 Voice changed to: ${TTS_VOICE}`);
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
