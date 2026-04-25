import pool from './src/lib/db';

async function check() {
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'organization_institute'");
  console.table(res.rows);
  await pool.end();
}

check();
