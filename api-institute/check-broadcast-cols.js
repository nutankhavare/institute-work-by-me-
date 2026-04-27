const { Pool } = require('pg');
const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

async function checkColumns() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'schema1' AND table_name = 'institute_broadcasts'
      ORDER BY ordinal_position
    `);
    console.log("institute_broadcasts columns:");
    console.table(res.rows);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}
checkColumns();
