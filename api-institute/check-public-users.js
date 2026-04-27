const { Pool } = require('pg');

const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

async function checkPublicUsers() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users'
    `);
    if (res.rows.length > 0) {
        console.log("Columns for public.users:");
        console.table(res.rows);
    } else {
        console.log("public.users table NOT found.");
    }
  } catch (err) {
    console.error("Error checking public.users:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPublicUsers();
