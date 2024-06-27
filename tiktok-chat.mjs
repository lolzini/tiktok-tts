import { WebcastPushConnection } from "tiktok-live-connector";
import synthAzureAudio from "./synthAzureAudio.mjs";
import playAudio from "./playAudio.mjs";

let tiktokUsername = "lolzini_es";

let tiktokChatConnection = new WebcastPushConnection(tiktokUsername, {
  processInitialData: false,
  fetchRoomInfoOnConnect: false,
});

tiktokChatConnection
  .connect()
  .then((state) => {
    console.info(`Connected`);
  })
  .catch((err) => {
    console.error("Failed to connect", err);
  });

tiktokChatConnection.on("chat", async (data) => {
  const route = `output/audio-${Date.now()}.wav`;
  const message = `${data.comment}`;
  console.log(`${data.uniqueId}:${data.comment}`);
  await synthAzureAudio(message, route);
});

tiktokChatConnection.on("gift", (data) => {
  playAudio("fairy-dust-sound-effect.mp3");
});
