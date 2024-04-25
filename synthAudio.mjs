import textToSpeech from "@google-cloud/text-to-speech";
import fs from "fs";
import util from "util";

const client = new textToSpeech.TextToSpeechClient();

export default async function (message, route = "output.mp3") {
  const request = {
    input: { text: message },
    voice: { languageCode: "es-MX", ssmlGender: "NEUTRAL" },
    audioConfig: { audioEncoding: "MP3" },
  };

  const [response] = await client.synthesizeSpeech(request);
  const writeFile = util.promisify(fs.writeFile);
  await writeFile(route, response.audioContent, "binary");
  console.log(`Audio content written to file: ${route}`);
}
