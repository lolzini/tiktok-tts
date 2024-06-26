import "dotenv/config";
import sdk from "microsoft-cognitiveservices-speech-sdk";
import playAudio from "./playAudio.mjs";

export default async function (message, route, voice = "es-MX-YagoNeural") {
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.KEY,
    process.env.REGION
  );

  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(route);

  // The language of the voice that speaks.
  speechConfig.speechSynthesisVoiceName = voice;
  // speechConfig.speechSynthesisOutputFormat =
  //   sdk.SpeechSynthesisOutputFormat.Riff48Khz16BitMonoPcm;

  // Create the speech synthesizer.
  var synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  await synthesizer.speakTextAsync(
    message,
    function (result) {
      if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
        console.log(`playing audio: ${route}`);
        playAudio(route);
      } else {
        console.error(
          "Speech synthesis canceled, " +
            result.errorDetails +
            "\nDid you set the speech resource key and region values?"
        );
      }
      synthesizer.close();
      synthesizer = null;
    },
    function (err) {
      console.trace("err - " + err);
      synthesizer.close();
      synthesizer = null;
    }
  );
}
