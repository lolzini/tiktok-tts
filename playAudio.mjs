import { exec } from "child_process";

export default function playAudio(route) {
  exec(`vlc ${route} --play-and-exit`, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stdout);
  });
}
