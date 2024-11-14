import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "stream-overlay",
  password: "12345678",
  port: 5432,
});

pool.connect((error) => {
  if (error) {
    console.error("Connection error", error.stack);
  } else {
    console.log("Connected to PostgreSQL");
  }
});

export async function addUserToCredits(username, platform) {
  const today = new Date().toISOString();
  try {
    await pool.query(
      `INSERT INTO chat_users (username, platform, interaction_count, date_added)
       VALUES ($1, $2, 1, $3)
       ON CONFLICT (username, date_added, platform)
       DO UPDATE SET interaction_count = chat_users.interaction_count + 1`,
      [username, platform, today]
    );
    console.log(`Added or updated ${username} for ${platform} on ${today}`);
  } catch (error) {
    console.error("Error inserting/updating username:", error);
  }
}

export async function getChatUsernames() {
  const res = await pool.query(
    "SELECT username, interaction_count, date_added FROM chat_users"
  );
  const usernames = res.rows;
  console.log("Usernames for credits:", usernames);
  return usernames;
}
