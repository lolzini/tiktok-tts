import tmi from "tmi.js";
import synthAzureAudio from "../../audio/synth-azure-audio.mjs";
import { replaceLinks } from "../../utils/utils.mjs";
import emotes from "../../utils/emotes-array.json" with { type: "json" };
import { addUserToCredits } from "../../database/db.mjs";
import {
  logDebug,
  logInfo,
  logError,
} from "../../utils/console-colors.mjs";

const client = new tmi.Client({
  channels: ["lolzini_es"],
});

client.connect();

client.on("connected", () => {
  console.log("Twitch Connected");
});

client.on("message", async (channel, tags, message, self) => {
  logDebug(
    "Twitch",
    `Raw message event data: channel=${channel}, tags=${JSON.stringify(
      tags
    )}, message=${message}, self=${self}`
  );

  if (
    message.startsWith("@") ||
    message.startsWith("!") ||
    message.startsWith("http")
  )
    return;

  const filteredMessage = filterStrings(message, emotes);

  if (!filteredMessage) return;

  const username = tags["display-name"];

  const voice = getVoice(username);
  const route = `output/audio-${Date.now()}.wav`;
  await addUserToCredits(username, "twitch");
  await synthAzureAudio(replaceLinks(filteredMessage), route, voice);
});

function filterStrings(message, wordsToFilter) {
  const pattern = new RegExp(
    `\\b(${wordsToFilter.map(escapeRegExp).join("|")})\\b`,
    "gi"
  );
  return message
    .replace(pattern, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getVoice(username) {
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