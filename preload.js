const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Status + Events
  onTiktokStatus: (callback) =>
    ipcRenderer.on("tiktok-status", (_event, data) => callback(_event, data)),
  onTiktokEvent: (callback) =>
    ipcRenderer.on("tiktok-event", (_event, data) => callback(_event, data)),

  // Test actions
  playSound: (file) => ipcRenderer.send("play-sound", file),
  speak: (text) => ipcRenderer.send("speak-text", text),

  // ✅ Voice toggle
  setVoice: (voice) => ipcRenderer.send("set-voice", voice),
});
