import pool from './src/lib/db';

async function run() { 
  const tables = [
    'schema1.institute_roles',
    'schema1.institute_employees',
    'schema1.institute_vehicles',
    'schema1.institute_drivers',
    'schema1.institute_compliance'
  ];
  
  for (const table of tables) {
    try {
      await pool.query(`ALTER TABLE ${table} ALTER COLUMN org_id TYPE VARCHAR(255) USING org_id::text`);
      console.log(`Updated ${table} org_id type to VARCHAR.`);
    } catch (err: any) {
      console.error(`Error updating ${table}:`, err.message);
    }
  }
  process.exit(0);
}

run();
