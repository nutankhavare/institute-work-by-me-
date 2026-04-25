import pool from './src/lib/db';
import fs from 'fs';

async function exportOrgData() {
  const orgId = '32';
  try {
    const roles = await pool.query('SELECT * FROM schema1.institute_roles WHERE org_id = $1', [orgId]);
    const staff = await pool.query('SELECT * FROM schema1.institute_employees WHERE org_id = $1', [orgId]);
    const drivers = await pool.query('SELECT * FROM schema1.institute_drivers WHERE org_id = $1', [orgId]);
    const vehicles = await pool.query('SELECT * FROM schema1.institute_vehicles WHERE org_id = $1', [orgId]);

    const data = {
      roles: roles.rows,
      staff: staff.rows,
      drivers: drivers.rows,
      vehicles: vehicles.rows
    };

    fs.writeFileSync('org_32_data.json', JSON.stringify(data, null, 2));
    console.log('Data exported to org_32_data.json');
  } catch (err) {
    console.error("Export failed:", err);
  } finally {
    await pool.end();
  }
}

exportOrgData();
