import tmi from "tmi.js";
import synthAzureAudio from "./synthAzureAudio.mjs";
import { replaceLinks } from "./utils.mjs";
import emotes from "./emotes-array.json" with { type: "json" };

const client = new tmi.Client({
  channels: ["lolzini_es"],
});

client.connect();

client.on("connected", () => {
  console.log("Twitch Connected");
});

client.on("message", async (channel, tags, message, self) => {
  if (
    message.startsWith("@") ||
    message.startsWith("!") ||
    message.startsWith("http")
  )
    return;

  const filteredMessage = filterStrings(message,emotes);

  if (!filteredMessage) return;

  const voice = "es-ES-AlvaroNeural";
  const route = `output/audio-${Date.now()}.wav`;
  await synthAzureAudio(replaceLinks(filteredMessage), route, voice);
});

function filterStrings(message, wordsToFilter) {
  const pattern = new RegExp(`\\b(${wordsToFilter.map(escapeRegExp).join('|')})\\b`, 'gi');
  return message.replace(pattern, '').replace(/\s{2,}/g, ' ').trim();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}