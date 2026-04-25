import pool from './src/lib/db';

async function fix() {
  try {
    console.log('Fixing database schema...');
    await pool.query('CREATE SCHEMA IF NOT EXISTS schemaa');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schemaa."officeRoles" (
        id SERIAL PRIMARY KEY,
        org_id TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS schemaa."officePermissions" (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS schemaa."officeRolePermissions" (
        role_id INTEGER REFERENCES schemaa."officeRoles"(id) ON DELETE CASCADE,
        permission_id INTEGER REFERENCES schemaa."officePermissions"(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      )
    `);

    console.log('Schema repair complete!');
  } catch (err: any) {
    console.error('Repair failed:', err.message);
  }
  process.exit(0);
}

fix();
