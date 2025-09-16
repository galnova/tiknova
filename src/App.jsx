import React, { useEffect, useState } from "react";

function App() {
  const [events, setEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const [voice, setVoice] = useState("Zira"); // 👩 default

  useEffect(() => {
    window.electronAPI?.onTiktokEvent((_event, data) => {
      setEvents((prev) => [...prev.slice(-50), data]);
    });

    window.electronAPI?.onTiktokStatus((_event, data) => {
      setConnected(data.connected);
    });
  }, []);

  const addTestEvent = (type, msg, sound = null, speak = false) => {
    setEvents((prev) => [...prev.slice(-50), { type, msg }]);
    if (sound) window.electronAPI.playSound(sound);
    if (speak) window.electronAPI.speak(msg);
  };

  const toggleVoice = () => {
    const newVoice = voice === "Zira" ? "David" : "Zira";
    setVoice(newVoice);
    window.electronAPI.setVoice(newVoice);
  };

  return (
    <div className="App">
      {/* Status Bar */}
      <div className={`status-bar ${connected ? "connected" : "disconnected"}`}>
        {connected ? "🟢 Connected to TikTok" : "🔴 Disconnected"}
      </div>

      <h1>TikTok Live Bot</h1>

      {/* Voice Toggle */}
      <div className="voice-toggle">
        <button onClick={toggleVoice}>
          Switch to {voice === "Zira" ? "David (Male)" : "Zira (Female)"}
        </button>
      </div>

      {/* Now Playing Banner */}
      <div className="now-playing">
        🎤 Now using {voice === "Zira" ? "Zira (Female)" : "David (Male)"} voice
      </div>

      {/* Test buttons */}
      <div className="test-controls">
        <button
          onClick={() =>
            addTestEvent("chat", "User123 says Hello World!", null, true)
          }
        >
          Test Chat
        </button>
        <button
          onClick={() =>
            addTestEvent(
              "small-gift",
              "User456 sent a Rose 🌹",
              "sounds/small-gift.mp3"
            )
          }
        >
          Test Small Gift
        </button>
        <button
          onClick={() =>
            addTestEvent(
              "big-gift",
              "User789 sent a BIG gift 🎁",
              "sounds/big-gift.mp3"
            )
          }
        >
          Test Big Gift
        </button>
        <button
          onClick={() =>
            addTestEvent(
              "multi-gift",
              "User999 sent a COMBO gift 🎉",
              "sounds/multi-gift.mp3"
            )
          }
        >
          Test Multi Gift
        </button>
        <button
          onClick={() =>
            addTestEvent(
              "like",
              "User321 liked the stream ❤️",
              "sounds/like.mp3"
            )
          }
        >
          Test Like
        </button>
        <button
          onClick={() =>
            addTestEvent("follow", "User654 followed! ✅", "sounds/follow.mp3")
          }
        >
          Test Follow
        </button>
        {/* ✅ Test Share */}
        <button
          onClick={() =>
            addTestEvent("share", "User888 shared the stream 🔗", "sounds/share.mp3")
          }
        >
          Test Share
        </button>
      </div>

      {/* Event log */}
      <div className="events">
        {events.map((e, i) => (
          <div key={i} className={`event ${e.type}`}>
            <strong>[{e.type}]</strong> {e.msg}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
