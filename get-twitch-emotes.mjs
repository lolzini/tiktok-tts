import { exec } from "child_process";
import { writeFile } from "fs/promises";

const command = `twitch api get /chat/emotes/global`; // Replace with your CLI command
const logFile = "./twitch-emotes.json"; // Path to the file where you want to save the log

exec(command, async (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error.message}`);
    return;
  }

  // Combine stdout and stderr
  const output = stdout + stderr;

  try {
    // Write the output to a file
    await writeFile(logFile, output);
    console.log(`Output saved to ${logFile}`);
  } catch (err) {
    console.error(`Error writing to file: ${err.message}`);
  }
});
