import tmi from "tmi.js";
import synthAzureAudio from "./synthAzureAudio.mjs";

const client = new tmi.Client({
  channels: ["lolzini_es"],
});

client.connect();

client.on("connected", () => {
  console.log("Twitch Connected");
});

client.on("message", async (channel, tags, message, self) => {
  if (message.startsWith("@") || message.startsWith("!")) return;

  const voice = "es-ES-AlvaroNeural";
  const route = `output/audio-${Date.now()}.wav`;
  await synthAzureAudio(message, route, voice);
});
