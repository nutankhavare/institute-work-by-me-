const { Pool } = require('pg');

const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

async function revertOrgId() {
  const client = await pool.connect();
  try {
    // Step 1: Show BEFORE state
    const before = await client.query("SELECT id, email, org_id FROM public.users WHERE email = 'admin@aequs.com'");
    console.log("BEFORE:");
    console.table(before.rows);

    // Step 2: Revert org_id to 32
    await client.query("UPDATE public.users SET org_id = 32 WHERE email = 'admin@aequs.com'");

    // Step 3: Show AFTER state
    const after = await client.query("SELECT id, email, org_id FROM public.users WHERE email = 'admin@aequs.com'");
    console.log("AFTER:");
    console.table(after.rows);

    console.log("✅ Successfully reverted admin@aequs.com to org_id = 32");
  } catch (err) {
    console.error("Error reverting org_id:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

revertOrgId();
