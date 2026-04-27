const { Pool } = require('pg');

const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

async function checkOrgIdTypes() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
        SELECT table_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'schema1' AND column_name = 'org_id'
    `);
    console.table(res.rows);
  } catch (err) {
    console.error("Error checking org_id types:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkOrgIdTypes();
