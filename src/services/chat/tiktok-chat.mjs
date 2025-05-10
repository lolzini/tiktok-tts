import { WebSocketServer } from "ws";
import chalk from "chalk";
import { TikTokLiveConnection } from "tiktok-live-connector";
import synthAzureAudio from "../../audio/synth-azure-audio.mjs";
import playAudio from "../../audio/play-audio.mjs";
import { replaceLinks } from "../../utils/utils.mjs";
import { logDebug, logInfo, logError } from "../../utils/console-colors.mjs";
import {
  addProducerUser,
  addUserToCredits,
  addChatGift,
} from "../../database/db.mjs";

let tiktokUsername = "lolzini_es";

// WebSocket server instance for TikTok chat
let tiktokWss;
const TIKTOK_WEBSOCKET_PORT = 8081; // Port for this specific WebSocket server

// Function to start the WebSocket server within tiktok-chat.mjs
function startTikTokWebSocketServer(port) {
  tiktokWss = new WebSocketServer({ port });
  console.log(
    chalk.blueBright(
      `[TikTok Child Process] WebSocket server started on port ${port}`
    )
  );

  tiktokWss.on("connection", (ws) => {
    console.log(
      chalk.blueBright("[TikTok Child Process] WebSocket client connected")
    );
    ws.on("close", () => {
      console.log(
        chalk.blueBright("[TikTok Child Process] WebSocket client disconnected")
      );
    });
    ws.on("error", (error) => {
      console.error(
        chalk.red("[TikTok Child Process] WebSocket error:"),
        error
      );
    });
  });

  tiktokWss.on("error", (error) => {
    console.error(
      chalk.red("[TikTok Child Process] WebSocket Server Error:"),
      error
    );
  });
}

// Function to broadcast messages from this TikTok WebSocket server
function broadcastTikTokEvent(event) {
  if (!tiktokWss) {
    console.warn(
      chalk.yellow(
        "[TikTok Child Process] WebSocket server not initialized. Cannot broadcast."
      )
    );
    return;
  }
  const messageString = JSON.stringify(event);
  tiktokWss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      // Check WebSocket.OPEN constant if available in 'ws'
      client.send(messageString);
    }
  });
}

let tiktokChatConnection = new TikTokLiveConnection(tiktokUsername, {
  processInitialData: false,
  fetchRoomInfoOnConnect: false,
});

tiktokChatConnection
  .connect()
  .then((state) => {
    console.info(`TikTok Connected`);
    // Start the WebSocket server once TikTok connection is successful
    startTikTokWebSocketServer(TIKTOK_WEBSOCKET_PORT);
  })
  .catch((err) => {
    console.error("Failed to connect to TikTok", err);
    // Optionally, still start WebSocket server or exit based on requirements
    // For now, if TikTok fails to connect, its WebSocket server won't start.
  });

tiktokChatConnection.on("chat", async (data) => {
  logDebug("TikTok", `Raw chat event data: ${JSON.stringify(data)}`);

  const username = data.user?.uniqueId;
  const comment = data.comment;

  if (!username || !comment) {
    logError("TikTok", "Received chat event with missing username or comment.");
    logDebug("TikTok", `Problematic chat data: ${JSON.stringify(data)}`);
    return;
  }

  // Broadcast via local WebSocket server
  broadcastTikTokEvent({ type: "chat", platform: "tiktok", data });

  const route = `output/audio-${Date.now()}.wav`;
  const message = replaceLinks(`${comment}`);

  if (
    message.startsWith("@") ||
    message.startsWith("http") ||
    message === "undefined"
  )
    return;

  const voice = getVoice(username);

  console.log(`${new Date().getTime()} - ${username}:${comment}`);
  await addUserToCredits(username, "tiktok");
  await synthAzureAudio(message, route, voice);
});

// Add this at the top with other declarations
const userGiftCooldown = new Map();

tiktokChatConnection.on("gift", async (data) => {
  logDebug("TikTok", `Raw gift event data: ${JSON.stringify(data)}`);

  const username = data.user?.uniqueId;
  const giftName = data.giftDetails?.giftName;
  const repeatCount = data.repeatCount || 1;

  if (!username || !giftName) {
    logError(
      "TikTok",
      "Received gift event with missing username or gift name."
    );
    logDebug("TikTok", `Problematic gift data: ${JSON.stringify(data)}`);
    return;
  }

  // Broadcast via local WebSocket server
  broadcastTikTokEvent({ type: "gift", platform: "tiktok", data });

  console.log(
    `${new Date().getTime()} - Gift from ${username}: ${giftName} x${repeatCount}`
  );
  await addUserToCredits(username, "tiktok");
  await addProducerUser(username, "tiktok");
  await addChatGift(username, "tiktok", giftName, repeatCount);

  if (data.repeatEnd) {
    switch (giftName) {
      case "Rose":
        {
          const randomPipsas = Math.floor(Math.random() * 4) + 1;
          playAudio(`src/sfx/pipsas-${randomPipsas}.mp3`);
        }
        break;
      case "White Rose":
        {
          const cooldownMs = 60000;
          const lastTrigger = userGiftCooldown.get(username) || 0;
          const now = Date.now();

          if (now - lastTrigger < cooldownMs) {
            return;
          }
          userGiftCooldown.set(username, now);

          playAudio("src/sfx/rosa-blanca.mp3");
        }
        break;
      case "Doughnut":
        {
          const cooldownMs = 5000;
          const lastTrigger = userGiftCooldown.get(username) || 0;
          const now = Date.now();

          if (now - lastTrigger < cooldownMs) {
            return;
          }
          userGiftCooldown.set(username, now);

          playAudio("src/sfx/donuts.mp3");
        }
        break;
      case "Money Gun":
        {
          const cooldownMs = 5000;
          const lastTrigger = userGiftCooldown.get(username) || 0;
          const now = Date.now();

          if (now - lastTrigger < cooldownMs) {
            return;
          }
          userGiftCooldown.set(username, now);

          playAudio("src/sfx/dinero.mp3");
        }
        break;
      case "Finger Heart":
        {
          const cooldownMs = 5000;
          const lastTrigger = userGiftCooldown.get(username) || 0;
          const now = Date.now();

          if (now - lastTrigger < cooldownMs) {
            return;
          }
          userGiftCooldown.set(username, now);

          playAudio("src/sfx/chipi-chipi-chapa-chapa.mp3");
        }
        break;
      default:
        // No cooldown for other gifts
        playAudio("src/sfx/fairy-dust-sound-effect.mp3");
        break;
    }
  }
});

tiktokChatConnection.on("subscribe", async (data) => {
  logDebug("TikTok", `Raw subscribe event data: ${JSON.stringify(data)}`);

  const username = data.user?.uniqueId;

  if (!username) {
    logError("TikTok", "Received subscribe event with missing username.");
    logDebug("TikTok", `Problematic subscribe data: ${JSON.stringify(data)}`);
    return;
  }

  // Broadcast via local WebSocket server
  broadcastTikTokEvent({ type: "subscribe", platform: "tiktok", data });

  logInfo("TikTok", `User ${username} subscribed!`);
  await addUserToCredits(username, "tiktok");

  playAudio("src/sfx/happy-happy-happy-song.mp3");
});

function getVoice(username) {
  switch (username) {
    case "matx23.12":
      return "es-GQ-JavierNeural";
    case "lalinkesis":
      return "es-PE-CamilaNeural";
    case ".yosoytravis":
      return "es-ES-TristanMultilingualNeural";
    case "luciisalazar491":
      return "es-ES-EstrellaNeural";
    default:
      return "es-AR-ElenaNeural";
  }
}
