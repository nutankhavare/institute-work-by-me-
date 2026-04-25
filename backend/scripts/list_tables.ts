import pool from './src/lib/db';

async function list() {
  const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
  console.log(JSON.stringify(res.rows.map(r => r.table_name)));
  process.exit(0);
}
list();
