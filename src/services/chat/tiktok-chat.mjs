import { EventEmitter } from "events";
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

class TikTokChatClient extends EventEmitter {
  constructor(username) {
    super();
    this.tiktokUsername = username || "lolzini_es";
    this.tiktokChatConnection = null;
    this.userGiftCooldown = new Map();
    logInfo("TikTokClient", `Instance created for ${this.tiktokUsername}`);
  }

  connect() {
    logInfo("TikTokClient", `connect() called for ${this.tiktokUsername}`);
    this.tiktokChatConnection = new TikTokLiveConnection(this.tiktokUsername, {
      processInitialData: false,
      fetchRoomInfoOnConnect: false,
    });

    this._setupEventHandlers();
    return this.tiktokChatConnection
      .connect()
      .then((state) => {
        logInfo(
          "TikTokClient",
          `Successfully connected to TikTok live for ${
            this.tiktokUsername
          }. State: ${JSON.stringify(state)}`
        );
        this.emit("event", {
          type: "system",
          platform: "tiktok",
          event: "connected",
          data: { ...state, username: this.tiktokUsername },
        });
      })
      .catch((err) => {
        logError(
          "TikTokClient",
          `Failed to connect to TikTok for ${this.tiktokUsername}: ${err.message}`
        );
        this.emit("event", {
          type: "system",
          platform: "tiktok",
          event: "connection_error",
          data: {
            message: err.message,
            stack: err.stack,
            username: this.tiktokUsername,
          },
        });
      });
  }

  _setupEventHandlers() {
    logInfo(
      "TikTokClient",
      `_setupEventHandlers() called for ${this.tiktokUsername}`
    );
    this.tiktokChatConnection.on("chat", async (data) => {
      logInfo(
        "TikTokClient",
        `on("chat") event received for ${this.tiktokUsername}`
      );
      logDebug("TikTokClient", `Raw chat event data: ${JSON.stringify(data)}`);

      const username = data.user?.uniqueId;
      const comment = data.comment;

      if (!username || !comment) {
        logError("TikTokClient", "Chat event missing username or comment.");
        return;
      }

      this.emit("event", { type: "chat", platform: "tiktok", data });

      const route = `output/audio-${Date.now()}.wav`;
      const message = replaceLinks(`${comment}`);

      if (
        message.startsWith("@") ||
        message.startsWith("http") ||
        message === "undefined"
      ) {
        logDebug("TikTokClient", `Skipping TTS for comment: ${message}`);
        return;
      }

      const voice = this._getVoice(username);
      logInfo(
        "TikTokClient",
        `Preparing to synthesize chat for ${username}: "${message}" with voice ${voice} to route ${route}`
      );
      try {
        await synthAzureAudio(message, route, voice);
        logInfo(
          "TikTokClient",
          `Finished synthAzureAudio for ${username}: "${message}". Assuming playback is handled internally by synthAzureAudio for TikTok.`
        );
      } catch (synthError) {
        logError(
          "TikTokClient",
          `Error during synthAzureAudio for ${username}: ${synthError.message}`
        );
      }
      await addUserToCredits(username, "tiktok");
    });

    this.tiktokChatConnection.on("gift", async (data) => {
      logInfo(
        "TikTokClient",
        `on("gift") event received for ${this.tiktokUsername}`
      );
      logDebug("TikTokClient", `Raw gift event data: ${JSON.stringify(data)}`);

      const username = data.user?.uniqueId;
      const giftName = data.giftDetails?.giftName;
      const repeatCount = data.repeatCount || 1;

      if (!username || !giftName) {
        logError("TikTokClient", "Gift event missing username or gift name.");
        return;
      }

      this.emit("event", { type: "gift", platform: "tiktok", data });

      await addUserToCredits(username, "tiktok");
      await addProducerUser(username, "tiktok");
      await addChatGift(username, "tiktok", giftName, repeatCount);
      logInfo(
        "TikTokClient",
        `Gift from ${username}: ${giftName} x${repeatCount}. Added to credits/DB.`
      );

      if (data.repeatEnd) {
        logInfo(
          "TikTokClient",
          `Gift repeatEnd for ${giftName}. Processing SFX.`
        );
        let sfxPath = "src/sfx/fairy-dust-sound-effect.mp3";
        let playSpecificSfx = true;

        switch (giftName) {
          case "Rose":
            const randomPipsas = Math.floor(Math.random() * 4) + 1;
            sfxPath = `src/sfx/pipsas-${randomPipsas}.mp3`;
            break;
          case "White Rose":
            const cooldownMsWR = 60000;
            const lastTriggerWR =
              this.userGiftCooldown.get(`${username}_WhiteRose`) || 0;
            if (Date.now() - lastTriggerWR < cooldownMsWR)
              playSpecificSfx = false;
            else this.userGiftCooldown.set(`${username}_WhiteRose`, Date.now());
            sfxPath = "src/sfx/rosa-blanca.mp3";
            break;
          case "Doughnut":
            const cooldownMsD = 5000;
            const lastTriggerD =
              this.userGiftCooldown.get(`${username}_Doughnut`) || 0;
            if (Date.now() - lastTriggerD < cooldownMsD)
              playSpecificSfx = false;
            else this.userGiftCooldown.set(`${username}_Doughnut`, Date.now());
            sfxPath = "src/sfx/donuts.mp3";
            break;
          case "Money Gun":
            const cooldownMsMG = 5000;
            const lastTriggerMG =
              this.userGiftCooldown.get(`${username}_MoneyGun`) || 0;
            if (Date.now() - lastTriggerMG < cooldownMsMG)
              playSpecificSfx = false;
            else this.userGiftCooldown.set(`${username}_MoneyGun`, Date.now());
            sfxPath = "src/sfx/dinero.mp3";
            break;
          case "Finger Heart":
            const cooldownMsFH = 5000;
            const lastTriggerFH =
              this.userGiftCooldown.get(`${username}_FingerHeart`) || 0;
            if (Date.now() - lastTriggerFH < cooldownMsFH)
              playSpecificSfx = false;
            else
              this.userGiftCooldown.set(`${username}_FingerHeart`, Date.now());
            sfxPath = "src/sfx/chipi-chipi-chapa-chapa.mp3";
            break;
          default:
            break;
        }
        if (playSpecificSfx) {
          logInfo(
            "TikTokClient",
            `Attempting to play SFX: ${sfxPath} for gift ${giftName}`
          );
          try {
            await playAudio(sfxPath);
            logInfo("TikTokClient", `Finished playing SFX: ${sfxPath}`);
          } catch (playAudioError) {
            logError(
              "TikTokClient",
              `Error playing SFX ${sfxPath}: ${playAudioError.message}`
            );
          }
        } else {
          logInfo(
            "TikTokClient",
            `SFX for ${giftName} on cooldown for user ${username}. Skipping playback.`
          );
        }
      }
    });

    this.tiktokChatConnection.on("subscribe", async (data) => {
      logInfo(
        "TikTokClient",
        `on("subscribe") event received for ${this.tiktokUsername}`
      );
      logDebug(
        "TikTokClient",
        `Raw subscribe event data: ${JSON.stringify(data)}`
      );
      const username = data.user?.uniqueId;
      if (!username) {
        logError("TikTokClient", "Subscribe event missing username.");
        return;
      }
      this.emit("event", { type: "subscribe", platform: "tiktok", data });
      await addUserToCredits(username, "tiktok");
      logInfo(
        "TikTokClient",
        `User ${username} subscribed! Added to credits. Playing SFX.`
      );
      const sfxPath = "src/sfx/happy-happy-happy-song.mp3";
      try {
        await playAudio(sfxPath);
        logInfo(
          "TikTokClient",
          `Finished playing subscription SFX: ${sfxPath}`
        );
      } catch (playAudioError) {
        logError(
          "TikTokClient",
          `Error playing subscription SFX ${sfxPath}: ${playAudioError.message}`
        );
      }
    });

    this.tiktokChatConnection.on("disconnect", (reason) => {
      logError(
        "TikTokClient",
        `on("disconnect") event. Disconnected from TikTok for ${this.tiktokUsername}. Reason: ${reason}`
      );
      this.emit("event", {
        type: "system",
        platform: "tiktok",
        event: "disconnected",
        data: { reason, username: this.tiktokUsername },
      });
    });
  }

  _getVoice(username) {
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

  disconnect() {
    logInfo("TikTokClient", `disconnect() called for ${this.tiktokUsername}`);
    if (this.tiktokChatConnection) {
      this.tiktokChatConnection.disconnect();
    }
  }
}

export default TikTokChatClient;
