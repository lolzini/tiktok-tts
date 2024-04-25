import fs from "fs";

export default function deleteAudio(route) {
  return fs.unlink(route, (error) => {
    if (error) console.error(error);
  });
}
