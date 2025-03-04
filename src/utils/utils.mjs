// Utility functions for the TikTok TTS application

/**
 * Replaces links in a message with a placeholder to avoid TTS reading URLs
 * @param {string} message - The message to process
 * @returns {string} - The message with links replaced
 */
export function replaceLinks(message) {
  return message.replace(/https?:\/\/\S+/g, "link");
}