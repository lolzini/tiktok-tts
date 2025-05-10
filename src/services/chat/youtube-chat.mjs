import { EventEmitter } from "events";
import { LiveChat } from "youtube-chat";
import synthAzureAudio from "../../audio/synth-azure-audio.mjs";
// import playAudio from "../../audio/play-audio.mjs"; // Removed as synthAzureAudio handles playback
import { addUserToCredits } from "../../database/db.mjs";
import { logDebug, logInfo, logError } from "../../utils/console-colors.mjs";

class YouTubeChatClient extends EventEmitter {
  constructor(liveId) {
    super();
    this.liveId = liveId || "fj7m5qReVTs";
    this.liveChat = new LiveChat({ liveId: this.liveId });
    this.initialTime = null;
    logInfo("YouTubeClient", `Instance created for live ID: ${this.liveId}`);
    this._setupEventHandlers();
  }

  async connect() {
    logInfo("YouTubeClient", `connect() called for live ID: ${this.liveId}...`);
    try {
      const ok = await this.liveChat.start();
      if (!ok) {
        logError(
          "YouTubeClient",
          `Failed to start live chat for live ID: ${this.liveId}. liveChat.start() returned false.`
        );
        this.emit("event", {
          type: "system",
          platform: "youtube",
          event: "start_failed",
          data: {
            liveId: this.liveId,
            message: "liveChat.start() returned false",
          },
        });
      } else {
        logInfo(
          "YouTubeClient",
          `liveChat.start() successful for live ID: ${this.liveId}. Waiting for 'start' event from library.`
        );
      }
    } catch (err) {
      logError(
        "YouTubeClient",
        `Error during liveChat.start() for live ID: ${this.liveId}: ${err.message}`
      );
      this.emit("event", {
        type: "system",
        platform: "youtube",
        event: "connection_error",
        data: { message: err.message, stack: err.stack, liveId: this.liveId },
      });
    }
  }

  _setupEventHandlers() {
    logInfo(
      "YouTubeClient",
      `_setupEventHandlers() called for live ID: ${this.liveId}`
    );
    this.liveChat.on("start", (liveId) => {
      this.initialTime = new Date();
      logInfo(
        "YouTubeClient",
        `on("start") event: Connected to YouTube live chat: ${liveId}`
      );
      this.emit("event", {
        type: "start",
        platform: "youtube",
        data: { liveId },
      });
    });

    this.liveChat.on("chat", async (chatItem) => {
      logInfo(
        "YouTubeClient",
        `on("chat") event received for live ID: ${this.liveId}`
      );
      logDebug(
        "YouTubeClient",
        `Raw chat event data: ${JSON.stringify(chatItem)}`
      );
      this.emit("event", { type: "chat", platform: "youtube", data: chatItem });

      if (this.initialTime && chatItem.timestamp < this.initialTime) {
        logDebug("YouTubeClient", "Skipping old message based on initialTime.");
        return;
      }

      const pendingMessages = chatItem.message.filter((m) => m.text);
      if (pendingMessages.length < 1) {
        logDebug("YouTubeClient", "Skipping message with no text content.");
        return;
      }

      const text = pendingMessages.map((m) => m.text).join(" ");
      const voice = "es-CU-BelkysNeural";
      const route = `output/audio-${Date.now()}.wav`;
      const authorName = chatItem.author?.name || "UnknownUser";

      logInfo(
        "YouTubeClient",
        `Preparing to synthesize for ${authorName}: "${text}" with voice ${voice} to ${route}`
      );
      try {
        await synthAzureAudio(text, route, voice);
        logInfo(
          "YouTubeClient",
          `Finished synthAzureAudio for ${authorName}: "${text}". Assuming playback is handled internally.`
        );
      } catch (synthError) {
        logError(
          "YouTubeClient",
          `Error during synthAzureAudio for ${authorName}: ${synthError.message}`
        );
      }

      await addUserToCredits(authorName, "youtube");
    });

    this.liveChat.on("error", (err) => {
      logError(
        "YouTubeClient",
        `on("error") event for live ID ${this.liveId}: ${
          err.message || JSON.stringify(err)
        }`
      );
      const errorData = {
        message: err.message,
        stack: err.stack,
        name: err.name,
        liveId: this.liveId,
      };
      this.emit("event", {
        type: "error",
        platform: "youtube",
        data: errorData,
      });
    });

    this.liveChat.on("end", (reason) => {
      logInfo(
        "YouTubeClient",
        `on("end") event for live ID ${this.liveId}. Reason: ${reason}`
      );
      this.emit("event", {
        type: "end",
        platform: "youtube",
        data: { reason, liveId: this.liveId },
      });
    });
  }

  disconnect() {
    logInfo(
      "YouTubeClient",
      `disconnect() called for live ID: ${this.liveId}...`
    );
    // The youtube-chat library doesn't have an explicit stop/disconnect for an active chat after start.
    // It mainly has start() and an 'end' event when the stream itself finishes.
    // If you need to stop listening, you might remove listeners or handle it based on library capabilities.
    if (this.liveChat) {
      // No explicit stop method documented for liveChat instance after start.
      // Removing listeners might be an option if we want to stop processing events mid-stream.
      // For now, logging is sufficient as the library handles stream end.
      logInfo(
        "YouTubeClient",
        "youtube-chat library does not provide an explicit stop method after start. Stream will end naturally or on error."
      );
    }
  }
}

export default YouTubeChatClient;
