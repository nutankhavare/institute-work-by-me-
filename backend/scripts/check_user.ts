import pool from "./src/lib/db";

async function run() {
  try {
    const { rows } = await pool.query("SELECT id, email, password, role FROM users WHERE email = 'admin@aequs.com'");
    console.log("USER:", rows);
  } catch (err) {
    console.error("ERROR:", err);
  } finally {
    process.exit(0);
  }
}

run();
