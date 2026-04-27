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

async function onboardAdmin() {
  const client = await pool.connect();
  try {
    const hashedPassword = await bcrypt.hash('QuestGlobal@2026', 10);
    await client.query(`
      INSERT INTO schema1.users (org_id, email, password, role, status)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ['1', 'admin@questglobal.com', hashedPassword, 'ORG_ADMIN', 'Active']);
    console.log("✅ Superadmin onboarded for Institute: admin@questglobal.com / QuestGlobal@2026");
  } catch (err) {
    console.error("❌ Onboarding failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

onboardAdmin();
