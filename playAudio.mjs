import { exec } from "child_process";

// --play-and-exit works if VLC is set to Allow only one instance
// Tools > Preferences > Interface > [x] Allow only one instance

export default function playAudio(route) {
  exec(`vlc ${route} --play-and-exit`, (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(stdout);
  });
}
