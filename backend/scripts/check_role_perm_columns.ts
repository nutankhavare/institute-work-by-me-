import pool from './src/lib/db';

async function run() {
  const table = 'institute_role_permissions';
  const schema = 'schema1';
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position
    `, [schema, table]);
    console.log(`Columns for ${schema}.${table}:`);
    res.rows.forEach(row => {
      console.log(`- ${row.column_name} (${row.data_type})`);
    });
  } catch (err: any) {
    console.error(`Error checking ${schema}.${table}:`, err.message);
  }
  process.exit(0);
}

run();
