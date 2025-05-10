import { EventEmitter } from 'events';
import tmi from "tmi.js";
import synthAzureAudio from "../../audio/synth-azure-audio.mjs";
// import playAudio from "../../audio/play-audio.mjs"; // Removed as synthAzureAudio handles playback
import { replaceLinks } from "../../utils/utils.mjs";
import emotes from "../../utils/emotes-array.json" with { type: "json" };
import { addUserToCredits } from "../../database/db.mjs";
import {
  logDebug,
  logInfo,
  logError,
} from "../../utils/console-colors.mjs";

class TwitchChatClient extends EventEmitter {
  constructor(channels = ["lolzini_es"]) {
    super();
    this.channels = channels;
    this.client = new tmi.Client({
      channels: this.channels,
    });
    logInfo("TwitchClient", `Instance created for channels: ${this.channels.join(', ')}`);
    this._setupEventHandlers();
  }

  connect() {
    logInfo("TwitchClient", `connect() called for channels: ${this.channels.join(', ')}...`);
    return this.client.connect().catch(err => {
      logError("TwitchClient", `Failed to connect to Twitch: ${err.message}`);
      this.emit("event", {
        type: "system",
        platform: "twitch",
        event: "connection_error",
        data: { message: err.message, stack: err.stack, channels: this.channels },
      });
    });
  }

  _setupEventHandlers() {
    logInfo("TwitchClient", `_setupEventHandlers() called for channels: ${this.channels.join(', ')}`);
    this.client.on("connected", (address, port) => {
      logInfo("TwitchClient", `on("connected") event: Connected to Twitch ${address}:${port} for ${this.channels.join(', ')}`);
      this.emit("event", {
        type: "system",
        platform: "twitch",
        event: "connected",
        data: { message: "Twitch client connected to chat.", address, port, channels: this.channels },
      });
    });

    this.client.on("message", async (channel, tags, message, self) => {
      logInfo("TwitchClient", `on("message") event received for channel ${channel}`);
      logDebug("TwitchClient", `Raw message data: tags=${JSON.stringify(tags)}, message=${message}, self=${self}`);
      
      this.emit("event", { type: "message", platform: "twitch", data: { channel, tags, message, self } });

      if (
        message.startsWith("@") ||
        message.startsWith("!") ||
        message.startsWith("http")
      ) {
        logDebug("TwitchClient", `Skipping TTS for Twitch message: ${message}`);
        return;
      }

      const filteredMessage = this._filterStrings(message, emotes);
      if (!filteredMessage) {
        logDebug("TwitchClient", "Skipping TTS for empty filtered message.");
        return;
      }

      const username = tags["display-name"];
      const voice = this._getVoice(username);
      const route = `output/audio-${Date.now()}.wav`;

      logInfo("TwitchClient", `Preparing to synthesize for ${username}: "${filteredMessage}" with voice ${voice} to ${route}`);
      try {
        await synthAzureAudio(replaceLinks(filteredMessage), route, voice);
        logInfo("TwitchClient", `Finished synthAzureAudio for ${username}: "${filteredMessage}". Assuming playback is handled internally.`);
      } catch (synthError) {
        logError("TwitchClient", `Error during synthAzureAudio for ${username}: ${synthError.message}`);
      }
      
      await addUserToCredits(username, "twitch");
    });

    this.client.on('disconnected', (reason) => {
      logError("TwitchClient", `on("disconnected") event. Reason: ${reason} for ${this.channels.join(', ')}`);
      this.emit("event", {
        type: "system",
        platform: "twitch",
        event: "disconnected",
        data: { reason, channels: this.channels },
      });
    });
  }

  _filterStrings(message, wordsToFilter) {
    const pattern = new RegExp(
      `\\b(${wordsToFilter.map(this._escapeRegExp).join("|")})\\b`,
      "gi"
    );
    return message
      .replace(pattern, "")
      .replace(/\s{2,}/g, " ")
      .trim();
  }

  _escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  _getVoice(username) {
    switch (username) {
      case "sergiowagv":
        return "es-SV-RodrigoNeural";
      case "ericksinnombre":
        return "es-ES-TristanMultilingualNeural"
      case "dylanms96":
        return "en-US-GuyNeural"
      case "billie0409":
        return "pt-BR-DonatoNeural"
      case "ivancioofx":
        return "es-MX-JorgeNeural";
      case "lalinkesis":
        return "es-MX-CecilioNeural";
      case "lusm_an":
        return "es-ES-EstrellaNeural";
      default:
        return "es-MX-YagoNeural";
    }
  }

  disconnect() {
    logInfo("TwitchClient", `disconnect() called for channels: ${this.channels.join(', ')}...`);
    if (this.client) {
      this.client.disconnect().catch(err => {
        logError("TwitchClient", `Error during disconnect(): ${err.message}`);
      });
    }
  }
}

export default TwitchChatClient;
