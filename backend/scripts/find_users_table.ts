import pool from './src/lib/db';

async function check() {
  const res = await pool.query("SELECT table_name, table_schema FROM information_schema.tables WHERE table_name LIKE '%user%'");
  console.table(res.rows);
  await pool.end();
}

check();
