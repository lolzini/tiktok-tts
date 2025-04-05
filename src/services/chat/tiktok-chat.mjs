import { WebcastPushConnection } from "tiktok-live-connector";
import synthAzureAudio from "../../audio/synth-azure-audio.mjs";
import playAudio from "../../audio/play-audio.mjs";
import { replaceLinks } from "../../utils/utils.mjs";
import { addProducerUser, addUserToCredits } from "../../database/db.mjs";

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

// Add this at the top with other declarations
const userGiftCooldown = new Map();

tiktokChatConnection.on("gift", async (data) => {
  console.log(`${new Date().getTime()}`);
  await addUserToCredits(data.uniqueId, "tiktok");
  await addProducerUser(data.uniqueId, "tiktok");

  if (data.gift.repeat_end !== 0) {
    switch (data.giftName) {
      case "Rose":
        {
          const randomPipsas = Math.floor(Math.random() * 4) + 1;
          playAudio(`src/sfx/pipsas-${randomPipsas}.mp3`);
        }
        return;
      case "White Rose":
        {
          const cooldownMs = 60000;
          const lastTrigger = userGiftCooldown.get(data.uniqueId) || 0;
          const now = Date.now();

          if (now - lastTrigger < cooldownMs) {
            return;
          }
          userGiftCooldown.set(data.uniqueId, now);

          playAudio("src/sfx/rosa-blanca.mp3");
        }
        break;
      case "Doughnut":
        {
          const cooldownMs = 5000;
          const lastTrigger = userGiftCooldown.get(data.uniqueId) || 0;
          const now = Date.now();

          if (now - lastTrigger < cooldownMs) {
            return;
          }
          userGiftCooldown.set(data.uniqueId, now);

          playAudio("src/sfx/donuts.mp3");
        }
        break;
      case "Money Gun":
        {
          const cooldownMs = 5000;
          const lastTrigger = userGiftCooldown.get(data.uniqueId) || 0;
          const now = Date.now();

          if (now - lastTrigger < cooldownMs) {
            return;
          }
          userGiftCooldown.set(data.uniqueId, now);

          playAudio("src/sfx/dinero.mp3");
        }
        break;
      default:
        // No cooldown for other gifts
        playAudio("src/sfx/fairy-dust-sound-effect.mp3");
        break;
    }
  }
});

tiktokChatConnection.on("subscribe", (data) => {
  playAudio("src/sfx/happy-happy-happy-song.mp3");
});

function getVoice(username) {
  switch (username) {
    case "matx23.12":
      return "es-GQ-JavierNeural";
    case "lalinkesis":
      return "es-PE-CamilaNeural";
    default:
      return "es-AR-ElenaNeural";
  }
}
