import pool from './src/lib/db';

async function check() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'schema1' AND table_name = 'institute_vehicles'");
  console.table(res.rows);
  await pool.end();
}

check();
