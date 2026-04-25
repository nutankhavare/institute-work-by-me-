import pool from './src/lib/db';

async function check() {
  const res = await pool.query("SELECT email FROM public.users LIMIT 5");
  console.table(res.rows);
  await pool.end();
}

check();
