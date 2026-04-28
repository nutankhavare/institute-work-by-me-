const { Pool } = require('pg');
const pool = new Pool({
  host: 'vanloka-postgres.postgres.database.azure.com',
  port: 5432, user: 'vanloka_admin', password: 'MyNewPass@123',
  database: 'postgres', ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await pool.query('ALTER TABLE schema1.institute_employees ADD COLUMN beacon_id VARCHAR(255)');
    console.log('Successfully added beacon_id column');
  } catch (err) {
    if (err.code === '42701') {
      console.log('Column beacon_id already exists.');
    } else {
      console.error('Error altering table:', err);
    }
  } finally {
    pool.end();
  }
}

run();
