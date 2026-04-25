import pool from './src/lib/db';

async function migrate() {
  try {
    console.log("Checking for organization_address constraint...");
    const checkAddr = await pool.query(`
      SELECT 1 FROM pg_constraint WHERE conname = 'unique_address_org_id'
    `);
    if (checkAddr.rows.length === 0) {
      await pool.query('ALTER TABLE organization_address ADD CONSTRAINT unique_address_org_id UNIQUE (org_id)');
      console.log("Added unique_address_org_id");
    }

    console.log("Checking for organization_contacts constraint...");
    const checkContact = await pool.query(`
      SELECT 1 FROM pg_constraint WHERE conname = 'unique_contact_org_id'
    `);
    if (checkContact.rows.length === 0) {
      await pool.query('ALTER TABLE organization_contacts ADD CONSTRAINT unique_contact_org_id UNIQUE (org_id)');
      console.log("Added unique_contact_org_id");
    }

    console.log("Migration completed.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
