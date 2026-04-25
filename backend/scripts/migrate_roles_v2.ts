import pool from './src/lib/db';

async function migrate() {
  const table = 'schema1.institute_roles';
  try {
    console.log(`Checking columns for ${table}...`);
    
    // Add missing columns
    await pool.query(`
      ALTER TABLE ${table} 
      ADD COLUMN IF NOT EXISTS department TEXT,
      ADD COLUMN IF NOT EXISTS access_level TEXT,
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active',
      ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'Admin User'
    `);
    
    console.log(`Columns updated successfully.`);

    // Rename 'name' to 'role_name' if we want to be strictly consistent, 
    // but better to keep it 'name' in DB and map it in JS to avoid breaking other things.
    // However, the user's snippet uses 'roleName'.
    
    console.log(`Migration complete.`);
  } catch (err: any) {
    console.error(`Migration failed:`, err.message);
  }
  process.exit(0);
}

migrate();
