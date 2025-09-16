// tiktok-test.js
const { WebcastPushConnection } = require('tiktok-live-connector');

const username = "beccawalkingera"; // 👈 your TikTok handle (no @)
console.log("🔗 Attempting to connect as:", username);

let tiktok = new WebcastPushConnection(username);

tiktok.connect()
    .then(state => {
        console.log("✅ Connected to roomId:", state.room_id);
    })
    .catch(err => {
        console.error("❌ Failed to connect:", err);
    });

tiktok.on("chat", data => {
    console.log(`${data.uniqueId}: ${data.comment}`);
});

tiktok.on("like", data => {
    console.log(`${data.uniqueId} liked the stream`);
});

tiktok.on("follow", data => {
    console.log(`${data.uniqueId} followed`);
});

tiktok.on("gift", data => {
    console.log(`${data.uniqueId} sent gift: ${data.giftName}`);
});
