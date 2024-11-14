import { WebcastPushConnection } from "tiktok-live-connector";
import synthAzureAudio from "./synthAzureAudio.mjs";
import playAudio from "./playAudio.mjs";
import { replaceLinks } from "./utils.mjs";
import { addUserToCredits } from "./db.mjs";

let tiktokUsername = "lolzini_es";

let tiktokChatConnection = new WebcastPushConnection(tiktokUsername, {
  processInitialData: false,
  fetchRoomInfoOnConnect: false,
});

tiktokChatConnection
  .connect()
  .then((state) => {
    console.info(`TikTok Connected`);
  })
  .catch((err) => {
    console.error("Failed to connect", err);
  });

tiktokChatConnection.on("chat", async (data) => {
  const route = `output/audio-${Date.now()}.wav`;
  const message = replaceLinks(`${data.comment}`);
  const voice = "es-AR-ElenaNeural";

  if (
    message.startsWith("@") ||
    message.startsWith("http") ||
    message === "undefined"
  )
    return;

  console.log(`${new Date().getTime()} - ${data.uniqueId}:${data.comment}`);
  await addUserToCredits(data.uniqueId, "tiktok");
  await synthAzureAudio(message, route, voice);
});

tiktokChatConnection.on("gift", async (data) => {
  console.log(`${new Date().getTime()}`);
  await addUserToCredits(data.uniqueId, "tiktok");

  if (data.giftName === "White Rose") {
    playAudio("rosa-blanca.mp3");
  } else {
    playAudio("fairy-dust-sound-effect.mp3");
  }
});
