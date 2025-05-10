#!/usr/bin/env node

import { createInterface } from "readline";
// Removed: import { spawn } from "child_process";
import { dirname, join } from "path"; // join might still be useful for other things, or can be removed if not.
import { fileURLToPath } from "url";
import chalk from "chalk";
import { logDebug, logInfo, logError } from "./src/utils/console-colors.mjs"; // Assuming logInfo, logError are available
import {
  startWebSocketServer,
  broadcastMessage,
} from "./src/services/websocket/websocket-server.mjs";

// Import the new chat client classes
import YouTubeChatClient from "./src/services/chat/youtube-chat.mjs";
import TwitchChatClient from "./src/services/chat/twitch-chat.mjs";
import TikTokChatClient from "./src/services/chat/tiktok-chat.mjs";

// Check for development mode
if (process.env.NODE_ENV === "development") {
  console.log(chalk.yellow.bold("\n*** RUNNING IN DEVELOPMENT MODE ***\n"));
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// Define WebSocket server port for the central server
const WEBSOCKET_PORT = 8081;

// Available chat platforms - now using constructors
const platforms = {
  youtube: {
    name: "YouTube",
    // path: "./src/services/chat/youtube-chat.mjs", // No longer a script path
    ClientClass: YouTubeChatClient,
    config: { liveId: "fj7m5qReVTs" }, // Example: Pass specific config like liveId
  },
  twitch: {
    name: "Twitch",
    // path: "./src/services/chat/twitch-chat.mjs",
    ClientClass: TwitchChatClient,
    config: { channels: ["lolzini_es"] }, // Example: Pass channels
  },
  tiktok: {
    name: "TikTok",
    // path: "./src/services/chat/tiktok-chat.mjs",
    ClientClass: TikTokChatClient,
    config: { username: "lolzini_es" }, // Example: Pass username
  },
};

// Create readline interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Store active client instances
const activeClients = new Map(); // Using a Map to store clients by key

// Handle process termination
process.on("SIGINT", () => {
  console.log("\nShutting down all chat services...");
  activeClients.forEach((client, platformKey) => {
    if (client && typeof client.disconnect === "function") {
      logInfo(platformKey, "Attempting to disconnect...");
      client.disconnect();
    }
  });
  activeClients.clear();

  // Consider adding a small delay or promise.all for disconnections before exiting
  // For now, direct exit.
  logInfo("Main", "All services signaled to disconnect. Exiting.");
  process.exit(0);
  // WebSocket server will be closed as part of process exit.
  // If explicit wss.close() is needed, it should be handled here or in startWebSocketServer cleanup.
});

// Main menu function
function showMainMenu() {
  console.clear();
  console.log(chalk.cyan.bold("=== TikTok TTS Chat Platform Selector ===\n"));
  console.log(chalk.yellow("Select which chat platforms to start:"));
  console.log(chalk.green("1.") + " All platforms");
  console.log(chalk.red("2.") + " YouTube only");
  console.log(chalk.hex("#6441a5")("3.") + " Twitch only");
  console.log(chalk.hex("#00f2ea")("4.") + " TikTok only");
  console.log(chalk.blue("5.") + " Custom selection");
  console.log(chalk.gray("0.") + " Exit");

  rl.question("\nEnter your choice (0-5): ", (answer) => {
    switch (answer.trim()) {
      case "0":
        console.log(chalk.gray("Exiting..."));
        rl.close();
        process.emit("SIGINT"); // Trigger graceful shutdown
        break;
      case "1":
        startPlatforms(["youtube", "twitch", "tiktok"]);
        break;
      case "2":
        startPlatforms(["youtube"]);
        break;
      case "3":
        startPlatforms(["twitch"]);
        break;
      case "4":
        startPlatforms(["tiktok"]);
        break;
      case "5":
        showCustomSelectionMenu();
        break;
      default:
        console.log(chalk.red("Invalid option. Please try again."));
        setTimeout(showMainMenu, 1500);
    }
  });
}

// Custom selection menu
function showCustomSelectionMenu() {
  console.clear();
  console.log(chalk.cyan.bold("=== Custom Platform Selection ===\n"));
  console.log(chalk.yellow("Select platforms (comma-separated numbers):"));
  console.log(chalk.red("1.") + " YouTube");
  console.log(chalk.hex("#6441a5")("2.") + " Twitch");
  console.log(chalk.hex("#00f2ea")("3.") + " TikTok");
  console.log(chalk.gray("0.") + " Back to main menu");

  rl.question("\nEnter your choices (e.g., 1,3): ", (answer) => {
    if (answer.trim() === "0") {
      showMainMenu();
      return;
    }

    const selectedPlatforms = [];
    const choices = answer.split(",").map((c) => c.trim());

    if (choices.includes("1")) selectedPlatforms.push("youtube");
    if (choices.includes("2")) selectedPlatforms.push("twitch");
    if (choices.includes("3")) selectedPlatforms.push("tiktok");

    if (selectedPlatforms.length === 0) {
      console.log(chalk.red("No valid platforms selected. Please try again."));
      setTimeout(showCustomSelectionMenu, 1500);
    } else {
      startPlatforms(selectedPlatforms);
    }
  });
}

// Start selected platforms
function startPlatforms(platformKeys) {
  console.clear();
  console.log(chalk.cyan.bold("Starting chat services:\n"));

  platformKeys.forEach((key) => {
    if (activeClients.has(key)) {
      logInfo(platforms[key].name, "service is already running.");
      return;
    }

    const platformInfo = platforms[key];
    if (!platformInfo || !platformInfo.ClientClass) {
      logError(
        "Main",
        `Configuration error for platform key: ${key}. ClientClass not found.`
      );
      return;
    }

    const platformColor =
      key === "youtube"
        ? chalk.red
        : key === "twitch"
        ? chalk.hex("#6441a5")
        : chalk.hex("#00f2ea");
    console.log(platformColor(`Starting ${platformInfo.name} chat service...`));

    // Instantiate the client
    // Pass specific config. For YouTube, it's liveId. For Twitch, channels. For TikTok, username.
    let clientInstance;
    if (key === "youtube") {
      // IMPORTANT: Replace "YOUR_YOUTUBE_LIVE_ID" with the actual live ID
      // This should ideally come from a config file or environment variable
      clientInstance = new platformInfo.ClientClass(
        platformInfo.config.liveId || "YOUR_YOUTUBE_LIVE_ID_FALLBACK"
      );
    } else if (key === "twitch") {
      clientInstance = new platformInfo.ClientClass(
        platformInfo.config.channels || ["default_twitch_channel"]
      );
    } else if (key === "tiktok") {
      clientInstance = new platformInfo.ClientClass(
        platformInfo.config.username || "default_tiktok_username"
      );
    } else {
      clientInstance = new platformInfo.ClientClass(); // Fallback for other potential platforms
    }

    activeClients.set(key, clientInstance);

    // Listen for events from this client instance
    clientInstance.on("event", (message) => {
      // Ensure the message has a 'platform' field, or add it if necessary
      // The refactored clients should already include this in their emitted events.
      logDebug(`[${platformInfo.name}] Received event:`, message);
      broadcastMessage(message); // Broadcast the message via the central WebSocket server

      // Handle specific system events for logging or cleanup
      if (message.type === "system") {
        if (
          message.event === "disconnected" ||
          message.event === "connection_error" ||
          message.event === "start_failed"
        ) {
          logError(
            platformInfo.name,
            `Service event: ${message.event}. Data: ${JSON.stringify(
              message.data
            )}`
          );
          // Optionally remove from activeClients if it's a fatal, non-recoverable error
          // For now, we keep it, assuming the client might internally attempt reconnection or has emitted a final state.
          // if (message.event === "connection_error" || message.event === "start_failed") {
          //   activeClients.delete(key);
          // }
        }
      }
    });

    // Connect the client
    clientInstance.connect().catch((err) => {
      // This catch is for synchronous errors from connect() itself,
      // though most connection errors are emitted as events by the clients.
      logError(
        platformInfo.name,
        `Direct error calling connect(): ${err.message}`
      );
      activeClients.delete(key); // Remove if connect call itself failed badly
    });
  });

  if (platformKeys.length > 0) {
    console.log(chalk.green("\nSelected chat services are starting..."));
    console.log(chalk.yellow("Press Ctrl+C to stop all services and exit."));
  } else {
    console.log(
      chalk.yellow("No platforms selected to start. Returning to menu.")
    );
    setTimeout(showMainMenu, 1500);
  }
  // No longer waiting for child processes to exit to show main menu
  // If all platforms fail to start immediately, user might be stuck without menu.
  // Consider a timeout or a way to return to menu if activeClients remains empty after a bit.
}

// Start the application
console.log(chalk.cyan.bold("Welcome to TikTok TTS Chat Platform Selector"));
startWebSocketServer(WEBSOCKET_PORT); // Start the central WebSocket server
showMainMenu();
