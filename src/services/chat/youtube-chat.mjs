import { LiveChat } from "youtube-chat";
import synthAzureAudio from "../../audio/synth-azure-audio.mjs";
import { addUserToCredits } from "../../database/db.mjs";

// Replace on each LIVE
const liveId = "bpu6QdqCAdo";

const liveChat = new LiveChat({ liveId });

console.log("Connecting to YouTube live chat...");

let initialTime;

liveChat.on("start", (liveId) => {
  initialTime = new Date();
  console.log(`Connected to live chat: ${liveId}`);
});

liveChat.on("chat", async (chatItem) => {
  if (chatItem.timestamp < initialTime) return;
  const pendingMessages = chatItem.message.filter((m) => m.text);

  console.log(pendingMessages);

  if (pendingMessages.length < 1) return;

  const text = pendingMessages.map((m) => m.text).join(" ");

  const voice = "es-CU-BelkysNeural";
  const route = `output/audio-${Date.now()}.wav`;
  await addUserToCredits(chatItem.author.name, "youtube");
  await synthAzureAudio(text, route, voice);
});

liveChat.on("error", (err) => {
  console.error("Error in YouTube live chat:", err);
});

liveChat.on("end", (reason) => {
  console.log("Chat ended:", reason);
});

async function startChat() {
  const ok = await liveChat.start();
  if (!ok) {
    console.log("Failed to start live chat, check the error logs.");
  }
}

startChat();