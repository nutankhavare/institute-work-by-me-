import pool from './src/lib/db';

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE schema1.institute_vehicles 
      ADD COLUMN IF NOT EXISTS gps_sim_number VARCHAR(50),
      ADD COLUMN IF NOT EXISTS beacon_count INTEGER,
      ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS owner_contact_number VARCHAR(50),
      ADD COLUMN IF NOT EXISTS organisation_fleet_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS owner_id_proof TEXT,
      ADD COLUMN IF NOT EXISTS vendor_agreement TEXT
    `);
    console.log('Migration successful');
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

migrate();
