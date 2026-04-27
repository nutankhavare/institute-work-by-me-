const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

async function onboardAequs() {
  const client = await pool.connect();
  try {
    const email = 'admin@aequs.com';
    const password = 'Aequs@2026';
    const hashedPassword = await bcrypt.hash(password, 10);
    const orgId = '1';

    await client.query(`
      INSERT INTO schema1.users (email, password, role, org_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET password = $2, org_id = $4
    `, [email, hashedPassword, 'admin', orgId]);

    console.log(`✅ Onboarded ${email} successfully! You can now log in.`);
  } catch (err) {
    console.error("Error onboarding Aequs:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

onboardAequs();
