import pool from './src/lib/db';

async function run() { 
  const tables = [
    'schema1.institute_roles',
    'schema1.institute_permissions',
    'schema1.institute_role_permissions',
    'schema1.institute_employees',
    'schema1.institute_vehicles',
    'schema1.institute_drivers',
    'schema1.institute_compliance'
  ];
  const dummyId = '00000000-0000-0000-0000-000000000001';
  
  for (const table of tables) {
    try {
      const result = await pool.query(`DELETE FROM ${table} WHERE org_id::text = $1`, [dummyId]);
      console.log(`Cleaned ${result.rowCount} dummy records from ${table}`);
    } catch (err: any) {
      console.error(`Error cleaning ${table}:`, err.message);
    }
  }
  process.exit(0);
}

run();
