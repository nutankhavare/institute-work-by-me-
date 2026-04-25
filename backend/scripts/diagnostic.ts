import pool from './src/lib/db';

async function check() { 
  try {
    const roles = await pool.query('SELECT * FROM schemaa."officeRoles"');
    const perms = await pool.query('SELECT * FROM schemaa."officePermissions"');
    
    let junctionCount = 0;
    try {
      const junction = await pool.query('SELECT * FROM schemaa."officeRolePermissions"');
      junctionCount = junction.rowCount || 0;
    } catch (e) {
      console.log('Junction table might be missing');
    }

    console.log('Roles Count:', roles.rowCount);
    console.log('Permissions Count:', perms.rowCount);
    console.log('Junction (Links) Count:', junctionCount);
    
    if (roles.rowCount > 0) {
      console.log('Roles:', roles.rows.map(r => ({ id: r.id, name: r.name, org: r.org_id })));
    }
  } catch (err: any) {
    console.error('Error during diagnostic:', err.message);
  }
  process.exit(0);
} 

check();
