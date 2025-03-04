import { exec } from "child_process";

export default function playAudio(audioFile) {
  return new Promise((resolve, reject) => {
    exec(`vlc "${audioFile}" --play-and-exit`, (error, stdout, stderr) => {
      if (error) {
        console.error("Error playing audio:", error);
        reject(error);
        return;
      }
      resolve();
    });
  });
}