import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { logInfo, logError } from '../utils/console-colors.mjs';

// Create database connection
const db = await open({
  filename: "./database.sqlite",
  driver: sqlite3.Database,
});

// Initialize the table
await db.exec(`
  CREATE TABLE IF NOT EXISTS chat_users (
    username TEXT,
    platform TEXT,
    interaction_count INTEGER,
    date_added TEXT,
    PRIMARY KEY (username, platform)
  )
`);

export async function addUserToCredits(username, platform) {
  const today = new Date().toISOString();
  try {
    await db.run(
      `
      INSERT INTO chat_users (username, platform, interaction_count, date_added)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(username, platform)
      DO UPDATE SET interaction_count = interaction_count + 1,
                    date_added = ?`,
      [username, platform, today, today]
    );
    logInfo(platform, `Added or updated ${username} on ${today}`);
  } catch (error) {
    logError(platform, `Error inserting/updating username: ${error}`);
  }
}

export async function getChatUsernames() {
  try {
    const usernames = await db.all(
      "SELECT username, interaction_count, date_added FROM chat_users"
    );
    logInfo('Database', `Retrieved ${usernames.length} usernames for credits`);
    return usernames;
  } catch (error) {
    logError('Database', `Error getting usernames: ${error}`);
    return [];
  }
}