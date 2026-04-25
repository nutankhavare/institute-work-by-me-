import pool from './src/lib/db';

async function migrate() {
  try {
    console.log("Checking for organization_institute constraint...");
    const checkInst = await pool.query(`
      SELECT 1 FROM pg_constraint WHERE conname = 'unique_institute_org_id'
    `);
    if (checkInst.rows.length === 0) {
      await pool.query('ALTER TABLE organization_institute ADD CONSTRAINT unique_institute_org_id UNIQUE (org_id)');
      console.log("Added unique_institute_org_id");
    }
    console.log("Migration completed.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
