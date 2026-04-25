import pool from './src/lib/db';

async function finalMigration() {
  try {
    await pool.query(`
      ALTER TABLE schema1.institute_vehicles 
      ADD COLUMN IF NOT EXISTS kilometers_driven INTEGER,
      ADD COLUMN IF NOT EXISTS gps_sim_number VARCHAR(50),
      ADD COLUMN IF NOT EXISTS beacon_count INTEGER,
      ADD COLUMN IF NOT EXISTS assigned_driver_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS assigned_route_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS owner_contact_number VARCHAR(50),
      ADD COLUMN IF NOT EXISTS organisation_fleet_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS fitness_certificate_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS pollution_certificate_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS fire_extinguisher VARCHAR(50),
      ADD COLUMN IF NOT EXISTS first_aid_kit VARCHAR(50),
      ADD COLUMN IF NOT EXISTS cctv_installed VARCHAR(20),
      ADD COLUMN IF NOT EXISTS panic_button_installed VARCHAR(20),
      ADD COLUMN IF NOT EXISTS owner_id_proof TEXT,
      ADD COLUMN IF NOT EXISTS vendor_agreement TEXT;
    `);
    console.log('Final DB Migration Successful');
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await pool.end();
  }
}

finalMigration();
