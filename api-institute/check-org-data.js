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

  // Check public.organizations columns
  console.log("=== public.organizations COLUMNS ===");
  const cols = await c.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='organizations' 
    ORDER BY ordinal_position
  `);
  console.table(cols.rows);

  // Check sample data for org_id=38 (horizon)
  console.log("\n=== Organization for admin@horizon.com (org_id=38) ===");
  const r = await c.query('SELECT * FROM public.organizations WHERE id = 38');
  if (r.rows.length > 0) {
    console.log(JSON.stringify(r.rows[0], null, 2));
  } else {
    console.log("NOT FOUND");
  }

  // Also check schema1.institute_organizations
  console.log("\n=== schema1.institute_organizations COLUMNS ===");
  try {
    const s = await c.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_schema='schema1' AND table_name='institute_organizations' 
      ORDER BY ordinal_position
    `);
    console.table(s.rows);
    
    const d = await c.query('SELECT COUNT(*) as count FROM schema1.institute_organizations');
    console.log("Total rows in schema1.institute_organizations:", d.rows[0].count);
  } catch (e) {
    console.log("schema1.institute_organizations error:", e.message);
  }

  c.release();
  await pool.end();
})();
