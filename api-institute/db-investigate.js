const { Pool } = require('pg');
const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

async function investigate() {
  const c = await pool.connect();

  // 1. Show ALL organizations (created by super admin)
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  DATABASE INVESTIGATION — public.organizations      ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");
  
  const orgs = await c.query(`SELECT id, name, type, email, phone, website, status, created_at FROM public.organizations ORDER BY id`);
  console.log("=== ALL Organizations (created by Super Admin) ===");
  console.table(orgs.rows);

  // 2. Show ALL users 
  console.log("\n=== ALL Users (login credentials) ===");
  const users = await c.query(`SELECT id, email, org_id, role, name FROM public.users ORDER BY id`);
  console.table(users.rows);

  // 3. Show how login works — it uses public.users, NOT public.organizations
  console.log("\n=== HOW LOGIN WORKS ===");
  console.log("  LOGIN uses: public.users (email + password_hash)");
  console.log("  SETTINGS uses: public.organizations (name, email, phone, etc.)");
  console.log("");
  console.log("  Problem: Organization email/phone is NULL because super admin didn't fill them.");
  console.log("  The user CAN login because public.users has their email+password.");
  console.log("  But Settings page shows NULL for org email/phone because those are org-level fields.");

  // 4. Show the specific issue for org_id=38
  console.log("\n=== Org 38 (Horizon) - Current State ===");
  const org38 = await c.query(`SELECT * FROM public.organizations WHERE id = 38`);
  console.log(JSON.stringify(org38.rows[0], null, 2));

  // 5. Show the columns available in public.organizations
  console.log("\n=== public.organizations columns ===");
  const cols = await c.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'organizations' 
    ORDER BY ordinal_position
  `);
  console.table(cols.rows);

  c.release();
  await pool.end();
}

investigate().catch(console.error);
