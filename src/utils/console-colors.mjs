import chalk from "chalk";

// Platform-specific colors
const platformColors = {
  youtube: chalk.red,
  twitch: chalk.hex("#6441a5"),
  tiktok: chalk.hex("#00f2ea"),
};

// Message type colors
const messageColors = {
  info: chalk.blue,
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
};

// Format platform name with its specific color
export function formatPlatform(platform) {
  const colorFn = platformColors[platform.toLowerCase()] || chalk.white;
  return colorFn(`[${platform}]`);
}

// Format message with type-specific color
export function formatMessage(type, message) {
  const colorFn = messageColors[type.toLowerCase()] || chalk.white;
  return colorFn(message);
}

// Convenience methods for different message types
export function logInfo(platform, message) {
  console.log(`${formatPlatform(platform)} ${formatMessage("info", message)}`);
}

export function logSuccess(platform, message) {
  console.log(
    `${formatPlatform(platform)} ${formatMessage("success", message)}`
  );
}

export function logError(platform, message) {
  console.error(
    `${formatPlatform(platform)} ${formatMessage("error", message)}`
  );
}

export function logWarning(platform, message) {
  console.warn(
    `${formatPlatform(platform)} ${formatMessage("warning", message)}`
  );
}

// Debug logging (only outputs in development mode)
export function logDebug(platform, message) {
  if (process.env.NODE_ENV === "development") {
    console.log(
      `${formatPlatform(platform)} ${chalk.magenta("[DEBUG]")} ${message}`
    );
  }
}
