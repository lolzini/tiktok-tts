import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { logInfo, logError } from "../utils/console-colors.mjs";

// Create database connection
const db = await open({
  filename: "./database.sqlite",
  driver: sqlite3.Database,
});

// Initialize the tables
await db.exec(`
  CREATE TABLE IF NOT EXISTS chat_users (
    username TEXT NOT NULL CHECK(username <> ''),
    platform TEXT,
    interaction_count INTEGER,
    date_added TEXT,
    PRIMARY KEY (username, platform)
  )
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS chat_gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL CHECK(username <> ''),
    platform TEXT,
    gift_type TEXT,
    gift_amount INTEGER,
    timestamp TEXT,
    FOREIGN KEY (username, platform) REFERENCES chat_users(username, platform)
  )
`);

await db.exec(`
  CREATE TABLE IF NOT EXISTS producer_users (
    username TEXT NOT NULL CHECK(username <> ''),
    platform TEXT,
    interaction_count INTEGER,
    date_added TEXT,
    PRIMARY KEY (username, platform)
  )
`);

export async function addUserToCredits(username, platform) {
  if (!username) {
    logError(platform, "Attempted to add user with no username.");
    return;
  }
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
    logInfo("Database", `Retrieved ${usernames.length} usernames for credits`);
    return usernames;
  } catch (error) {
    logError("Database", `Error getting usernames: ${error}`);
    return [];
  }
}

export async function addProducerUser(username, platform) {
  if (!username) {
    logError(platform, "Attempted to add producer user with no username.");
    return;
  }
  const today = new Date().toISOString();
  try {
    await db.run(
      `
      INSERT INTO producer_users (username, platform, interaction_count, date_added)
      VALUES (?, ?, 1, ?)
      ON CONFLICT(username, platform)
      DO UPDATE SET interaction_count = interaction_count + 1,
                    date_added = ?`,
      [username, platform, today, today]
    );
    logInfo(platform, `Added/updated producer ${username} on ${today}`);
  } catch (error) {
    logError(platform, `Error with producer user: ${error}`);
  }
}

export async function getProducerUsernames() {
  try {
    const usernames = await db.all(
      "SELECT username, interaction_count, date_added FROM producer_users"
    );
    logInfo("Database", `Retrieved ${usernames.length} producer usernames`);
    return usernames;
  } catch (error) {
    logError("Database", `Error getting producers: ${error}`);
    return [];
  }
}

export async function addChatGift(username, platform, giftType, giftAmount) {
  if (!username) {
    logError(platform, "Attempted to add gift with no username.");
    return;
  }
  const timestamp = new Date().toISOString();
  try {
    await db.run(
      `
      INSERT INTO chat_gifts (username, platform, gift_type, gift_amount, timestamp)
      VALUES (?, ?, ?, ?, ?)
      `,
      [username, platform, giftType, giftAmount, timestamp]
    );
    logInfo(
      platform,
      `Recorded gift from ${username}: ${giftType} x${giftAmount}`
    );
  } catch (error) {
    logError(platform, `Error recording gift: ${error}`);
  }
}

export async function getChatGifts() {
  try {
    const gifts = await db.all(
      `SELECT username, platform, gift_type, gift_amount, timestamp 
      FROM chat_gifts 
      ORDER BY timestamp DESC`
    );
    logInfo("Database", `Retrieved ${gifts.length} chat gifts`);
    return gifts;
  } catch (error) {
    logError("Database", `Error getting chat gifts: ${error}`);
    return [];
  }
}
