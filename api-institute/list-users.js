const { Pool } = require('pg');

const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

async function listUsers() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, email, org_id FROM schema1.users");
    console.log("Registered Users:");
    console.table(res.rows);
  } catch (err) {
    console.error("Error listing users:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

listUsers();
