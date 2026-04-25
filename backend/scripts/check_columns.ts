import pool from './src/lib/db';

async function run() { 
  const tables = ['organizations', 'organization_address', 'organization_contacts', 'organization_institute'];
  for (const table of tables) {
    try {
      const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
      console.log(`${table}:`, res.rows.map(r => r.column_name));
    } catch (err: any) {
      console.error(`Error checking ${table}:`, err.message);
    }
  }
  process.exit(0);
}

run();
