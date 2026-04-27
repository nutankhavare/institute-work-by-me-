const { Pool } = require('pg');

const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

async function findAequsOrg() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, name FROM public.organizations WHERE name ILIKE '%Aequs%'");
    console.log("Current Aequs Organizations in DB:");
    console.table(res.rows);
  } catch (err) {
    console.error("Error finding Aequs org:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

findAequsOrg();
