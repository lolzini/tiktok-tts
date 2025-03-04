import { WebcastPushConnection } from "tiktok-live-connector";
import synthAzureAudio from "../../audio/synth-azure-audio.mjs";
import playAudio from "../../audio/play-audio.mjs";
import { replaceLinks } from "../../utils/utils.mjs";
import { addUserToCredits } from "../../database/db.mjs";

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

  if (
    message.startsWith("@") ||
    message.startsWith("http") ||
    message === "undefined"
  )
    return;

  const voice = getVoice(data.uniqueId);

  console.log(`${new Date().getTime()} - ${data.uniqueId}:${data.comment}`);
  await addUserToCredits(data.uniqueId, "tiktok");
  await synthAzureAudio(message, route, voice);
});

tiktokChatConnection.on("gift", async (data) => {
  console.log(`${new Date().getTime()}`);
  await addUserToCredits(data.uniqueId, "tiktok");

  if (data.giftName === "White Rose") {
    playAudio("src/sfx/rosa-blanca.mp3");
  } else {
    playAudio("src/sfx/fairy-dust-sound-effect.mp3");
  }
});

function getVoice(username) {
  switch (username) {
    case "lalinkesis":
      return "es-US-AlonsoNeural";
    default:
      return "es-AR-ElenaNeural";
  }
}