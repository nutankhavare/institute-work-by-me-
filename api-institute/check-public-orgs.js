const { Pool } = require('pg');

const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

async function checkPublicOrgs() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'organizations'
    `);
    console.log("Columns for public.organizations:");
    console.table(res.rows);
  } catch (err) {
    console.error("Error checking public.organizations:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPublicOrgs();
