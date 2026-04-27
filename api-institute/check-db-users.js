const { Pool } = require('pg');
const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

(async () => {
  const c = await pool.connect();
  
  console.log("=== public.users (credentials) ===");
  const r = await c.query('SELECT id, email, password, org_id, role FROM public.users ORDER BY id');
  console.table(r.rows);

  console.log("\n=== Organization for org_id=1 (Aequs) ===");
  const o = await c.query('SELECT id, name, type, status FROM public.organizations WHERE id = 1');
  console.table(o.rows);

  console.log("\n=== Organization for org_id=32 ===");
  const o32 = await c.query('SELECT id, name, type, status FROM public.organizations WHERE id = 32');
  console.table(o32.rows);

  c.release();
  await pool.end();
})();
