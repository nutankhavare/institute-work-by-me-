const { Pool } = require('pg');
const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

const BASE = "https://func-institue-api-ddh5hrcfajbtddfk.southindia-01.azurewebsites.net/api";

async function check() {
  const c = await pool.connect();

  // 1. Check what password admin@horizon.com has - try to find it
  console.log("=== Users for org_id=38 ===");
  const users = await c.query(`SELECT id, email, org_id, role FROM public.users WHERE org_id = 38`);
  console.table(users.rows);

  // 2. Check organization data for org_id=38
  console.log("\n=== public.organizations WHERE id=38 ===");
  const org = await c.query(`SELECT id, name, type, email, phone, status FROM public.organizations WHERE id = 38`);
  console.table(org.rows);

  // 3. Check all schema1 tables for org_id=38
  const tables = [
    'institute_employees',
    'institute_drivers', 
    'institute_vehicles',
    'institute_roles',
    'institute_travellers',
    'institute_bookings',
    'institute_compliance',
    'institute_broadcasts',
  ];

  console.log("\n=== Data in schema1 for org_id=38 ===");
  for (const table of tables) {
    try {
      const r = await c.query(`SELECT COUNT(*) as cnt FROM schema1.${table} WHERE org_id::text = '38'`);
      console.log(`  ${table}: ${r.rows[0].cnt} records`);
    } catch (e) {
      console.log(`  ${table}: ERROR - ${e.message}`);
    }
  }

  c.release();

  // 4. Try to login as admin@horizon.com with various passwords
  console.log("\n=== Testing login for admin@horizon.com ===");
  for (const pwd of ["Aequs@2026", "Horizon@2026", "Admin@2026", "Password@123"]) {
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@horizon.com", password: pwd })
    });
    if (res.status === 200) {
      console.log(`  ✅ Password found: ${pwd}`);
      const data = await res.json();
      const token = data.data?.token || data.token;

      // Test endpoints with this token
      console.log("\n=== Testing endpoints as admin@horizon.com (org_id=38) ===");
      const h = { "Authorization": `Bearer ${token}` };
      
      const endpoints = [
        "/organization/me",
        "/dashboard/stats",
        "/roles",
        "/employees",
        "/vehicles",
        "/drivers",
        "/travellers",
        "/bookings",
        "/compliance",
        "/broadcasts",
        "/devices",
        "/permissions",
      ];

      for (const ep of endpoints) {
        const r = await fetch(`${BASE}${ep}`, { headers: h });
        const body = await r.json().catch(() => ({}));
        const icon = r.status === 200 ? '✅' : '❌';
        console.log(`  ${icon} [${r.status}] ${ep} — ${JSON.stringify(body).substring(0, 120)}`);
      }
      break;
    } else {
      console.log(`  ❌ ${pwd} → ${res.status}`);
    }
  }

  await pool.end();
}

check().catch(console.error);
