#!/usr/bin/env node

import { createInterface } from "readline";
import { spawn } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { logDebug } from "./src/utils/console-colors.mjs";

// Check for development mode
if (process.env.NODE_ENV === "development") {
  console.log(chalk.yellow.bold("\n*** RUNNING IN DEVELOPMENT MODE ***\n"));
  // You can add more dev-specific initializations here
}

const __dirname = dirname(fileURLToPath(import.meta.url));

// Available chat platforms
const platforms = {
  youtube: {
    name: "YouTube",
    path: "./src/services/chat/youtube-chat.mjs",
  },
  twitch: {
    name: "Twitch",
    path: "./src/services/chat/twitch-chat.mjs",
  },
  tiktok: {
    name: "TikTok",
    path: "./src/services/chat/tiktok-chat.mjs",
  },
};

// Create readline interface
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Store active processes
const activeProcesses = [];

// Handle process termination
process.on("SIGINT", () => {
  console.log("\nShutting down all chat services...");
  activeProcesses.forEach((proc) => {
    proc.kill();
  });
  process.exit(0);
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
        process.exit(0);
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
    const platform = platforms[key];
    const platformColor =
      key === "youtube"
        ? chalk.red
        : key === "twitch"
        ? chalk.hex("#6441a5")
        : chalk.hex("#00f2ea");
    console.log(platformColor(`Starting ${platform.name} chat service...`));

    const scriptPath = join(__dirname, platform.path);
    const process = spawn("node", [scriptPath], {
      stdio: "inherit",
      shell: true,
    });

    activeProcesses.push(process);

    process.on("error", (err) => {
      console.error(
        chalk.red(`Error starting ${platform.name} chat service:`),
        err
      );
      console.error(chalk.red("Exiting program due to critical error..."));
      process.exit(1);
    });

    process.on("exit", (code) => {
      const statusColor = code === 0 ? chalk.green : chalk.red;
      console.log(
        statusColor(`${platform.name} chat service exited with code ${code}`)
      );
      const index = activeProcesses.indexOf(process);
      if (index > -1) {
        activeProcesses.splice(index, 1);
      }

      // If service exited with error code, exit the program
      if (code !== 0) {
        console.error(
          chalk.red(
            `\n${platform.name} service failed with code ${code}. Exiting program...`
          )
        );
        process.exit(1);
      }

      // If all processes have exited normally, return to main menu
      if (activeProcesses.length === 0) {
        console.log(
          chalk.yellow(
            "\nAll chat services have stopped. Returning to main menu..."
          )
        );
        setTimeout(showMainMenu, 2000);
      }
    });
  });

  console.log(chalk.green("\nAll selected chat services are running."));
  console.log(chalk.yellow("Press Ctrl+C to stop all services and exit."));
}

// Start the application
console.log(chalk.cyan.bold("Welcome to TikTok TTS Chat Platform Selector"));
showMainMenu();
