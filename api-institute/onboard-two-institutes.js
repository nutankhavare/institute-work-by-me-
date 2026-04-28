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

// ─── Two New Institute Organisations ────────────────────────────────
const institutes = [
  {
    orgId: 40,
    orgName: "Greenfield Institute of Technology",
    orgType: "Institute",
    orgStatus: "Active",
    email: "admin@greenfield.edu.in",
    password: "Greenfield@2026",
    role: "admin"
  },
  {
    orgId: 41,
    orgName: "Sunrise Academy of Sciences",
    orgType: "Institute",
    orgStatus: "Active",
    email: "admin@sunriseacademy.edu.in",
    password: "Sunrise@2026",
    role: "admin"
  }
];

async function onboardInstitutes() {
  const client = await pool.connect();
  try {
    for (const inst of institutes) {
      const hashedPassword = await bcrypt.hash(inst.password, 10);

      // 1. Insert into public.organizations
      await client.query(`
        INSERT INTO public.organizations (id, name, type, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE SET name = $2, type = $3, status = $4
      `, [inst.orgId, inst.orgName, inst.orgType, inst.orgStatus]);

      console.log(`✅ Organisation created: [id=${inst.orgId}] ${inst.orgName}`);

      // 2. Insert into public.users
      await client.query(`
        INSERT INTO public.users (email, password, role, org_id)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO UPDATE SET password = $2, role = $3, org_id = $4
      `, [inst.email, hashedPassword, inst.role, inst.orgId]);

      console.log(`✅ User created: ${inst.email} → org_id=${inst.orgId}`);
    }

    // ─── Verify the inserts ──────────────────────────────────────────
    console.log("\n═══════════════════════════════════════════════════");
    console.log("  VERIFICATION — public.organizations");
    console.log("═══════════════════════════════════════════════════");
    const orgs = await client.query(
      `SELECT id, name, type, status FROM public.organizations WHERE id IN (40, 41) ORDER BY id`
    );
    console.table(orgs.rows);

    console.log("\n═══════════════════════════════════════════════════");
    console.log("  VERIFICATION — public.users");
    console.log("═══════════════════════════════════════════════════");
    const users = await client.query(
      `SELECT id, email, role, org_id FROM public.users WHERE org_id IN (40, 41) ORDER BY id`
    );
    console.table(users.rows);

    console.log("\n═══════════════════════════════════════════════════");
    console.log("  LOGIN CREDENTIALS");
    console.log("═══════════════════════════════════════════════════");
    console.log("  Org 1: Greenfield Institute of Technology");
    console.log("    Email   : admin@greenfield.edu.in");
    console.log("    Password: Greenfield@2026");
    console.log("");
    console.log("  Org 2: Sunrise Academy of Sciences");
    console.log("    Email   : admin@sunriseacademy.edu.in");
    console.log("    Password: Sunrise@2026");
    console.log("═══════════════════════════════════════════════════");

  } catch (err) {
    console.error("❌ Onboarding failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

onboardInstitutes();
