import pool from '../src/lib/db';

async function run() { 
  const table = 'institute_vehicles';
  const schema = 'schema1';
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = '${schema}' AND table_name = '${table}'
    `);
    console.log(`${schema}.${table} columns:`);
    res.rows.forEach(r => console.log(`- ${r.column_name} (${r.data_type})`));
  } catch (err: any) {
    console.error(`Error checking ${table}:`, err.message);
  }
  process.exit(0);
}

run();
