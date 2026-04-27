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

async function onboardPublic() {
  const client = await pool.connect();
  try {
    const email = 'admin@aequs.com';
    const password = 'Aequs@2026';
    const hashedPassword = await bcrypt.hash(password, 10);
    const orgId = 39; // Match the frontend's request for org 39

    // 1. Create Organization 39 in public (if missing)
    await client.query(`
      INSERT INTO public.organizations (id, name, type, status)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, [orgId, 'Aequs Institute', 'Institute', 'Active']);

    // 2. Create User in public
    await client.query(`
      INSERT INTO public.users (email, password, role, org_id)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET password = $2, org_id = $4
    `, [email, hashedPassword, 'admin', orgId]);

    console.log(`✅ Onboarded ${email} into public.users with org_id: ${orgId}`);
  } catch (err) {
    console.error("Error onboarding into public.users:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

onboardPublic();
