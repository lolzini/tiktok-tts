import jsonObject from "./twitch-emotes.json" with { type: "json" };

import { writeFile } from "fs/promises";



try {
    const emotes = jsonObject.data.map(({name}) => name)
    await writeFile("./emotes-array.json",JSON.stringify(emotes));
    console.log(`Output saved`);
  } catch (err) {
    console.error(`Error writing to file: ${err.message}`);
  }