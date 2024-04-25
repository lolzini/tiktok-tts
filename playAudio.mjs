import { exec } from "child_process";

export default function playAudio(route) {
  exec(`vlc ${route} --playlist-enqueue`, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stdout);
  });
}
