import sdk from "microsoft-cognitiveservices-speech-sdk";
import dotenv from "dotenv";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";
import playAudio from "./play-audio.mjs";

dotenv.config();

const { SpeechConfig, AudioConfig, SpeechSynthesizer } = sdk;
const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function (
  message,
  route = "output.wav",
  voice = "es-MX-JorgeNeural"
) {
  const speechConfig = SpeechConfig.fromSubscription(
    process.env.SPEECH_KEY,
    process.env.SPEECH_REGION
  );

  speechConfig.speechSynthesisVoiceName = voice;

  // Ensure route is absolute and output directory exists
  const outputPath =
    route.startsWith("/") || route.includes(":")
      ? route
      : join(dirname(dirname(__dirname)), route);

  const outputDir = dirname(outputPath);
  mkdirSync(outputDir, { recursive: true });

  const audioConfig = AudioConfig.fromAudioFileOutput(outputPath);
  const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      message,
      (result) => {
        if (result) {
          console.log(`Audio content written to file: ${outputPath}`);
          synthesizer.close();
          playAudio(outputPath)
            .then(() => resolve())
            .catch((error) => {
              console.error("Error playing synthesized audio:", error);
              resolve();
            });
        }
      },
      (error) => {
        console.log(error);
        synthesizer.close();
        reject(error);
      }
    );
  });
}
