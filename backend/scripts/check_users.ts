import pool from './src/lib/db';

async function check() {
  try {
    const res = await pool.query('SELECT email FROM schema1.institute_users LIMIT 5');
    console.table(res.rows);
  } catch (err) {
    console.error("Failed to query users:", err);
  } finally {
    await pool.end();
  }
}

check();
