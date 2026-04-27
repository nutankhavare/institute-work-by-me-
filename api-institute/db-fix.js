const { Pool } = require('pg');
const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

async function fixAndVerify() {
  const c = await pool.connect();

  // 1. Show users table structure
  console.log("=== public.users columns ===");
  const userCols = await c.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' 
    ORDER BY ordinal_position
  `);
  console.table(userCols.rows);

  // 2. Show all users
  console.log("\n=== ALL Users ===");
  const users = await c.query(`SELECT id, email, org_id, role FROM public.users ORDER BY id`);
  console.table(users.rows);

  // 3. Show Institute-type organizations with NULL email
  console.log("\n=== Institute orgs with NULL email/phone ===");
  const nullOrgs = await c.query(`
    SELECT o.id, o.name, o.type, o.email, o.phone, u.email as user_email
    FROM public.organizations o
    LEFT JOIN public.users u ON u.org_id = o.id
    WHERE o.email IS NULL
    ORDER BY o.id
  `);
  console.table(nullOrgs.rows);

  // 4. FIX: Update organizations that have NULL email — copy from the admin user
  console.log("\n=== FIXING: Updating NULL org emails from admin user emails ===");
  const updateResult = await c.query(`
    UPDATE public.organizations o
    SET email = u.email
    FROM public.users u
    WHERE u.org_id = o.id 
      AND u.role = 'ORG_ADMIN'
      AND o.email IS NULL
    RETURNING o.id, o.name, o.email
  `);
  console.log(`Updated ${updateResult.rowCount} organizations:`);
  console.table(updateResult.rows);

  // 5. Verify the fix
  console.log("\n=== AFTER FIX: All organizations ===");
  const orgsAfter = await c.query(`
    SELECT id, name, type, email, phone, status 
    FROM public.organizations 
    ORDER BY id
  `);
  console.table(orgsAfter.rows);

  // 6. Specifically verify org 38
  console.log("\n=== Org 38 (Horizon) — After Fix ===");
  const org38 = await c.query(`SELECT id, name, type, email, phone, status FROM public.organizations WHERE id = 38`);
  console.table(org38.rows);

  c.release();
  await pool.end();
}

fixAndVerify().catch(console.error);
