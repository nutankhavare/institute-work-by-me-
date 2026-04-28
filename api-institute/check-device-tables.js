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

  // Check RLS on institute_gps
  console.log("=== RLS on institute_gps ===");
  const r1 = await c.query(`
    SELECT relname, relrowsecurity, relforcerowsecurity 
    FROM pg_class 
    WHERE relname IN ('institute_gps', 'institute_beacon', 'institute_vehicles', 'institute_drivers', 'institute_devices')
    AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'schema1')
  `);
  console.table(r1.rows);

  // Check policies
  console.log("\n=== RLS Policies ===");
  const r2 = await c.query(`
    SELECT schemaname, tablename, policyname, cmd, qual
    FROM pg_policies 
    WHERE schemaname = 'schema1' 
    AND tablename IN ('institute_gps', 'institute_beacon', 'institute_vehicles', 'institute_drivers', 'institute_devices')
  `);
  console.table(r2.rows);

  // Test: Try the exact query the dropdown runs
  console.log("\n=== Test GPS dropdown query (org 39) ===");
  try {
    await c.query(`SET LOCAL app.current_org_id = 39`);
    const r3 = await c.query(`
      SELECT id, device_id, sim_number, status, assigned_to
      FROM schema1.institute_gps
      WHERE allocated_to_org = $1 AND is_active = true
      ORDER BY device_id ASC
    `, [39]);
    console.log("GPS count:", r3.rows.length);
    if (r3.rows.length > 0) console.table(r3.rows.slice(0, 3));
  } catch (e) {
    console.log("GPS query FAILED:", e.message);
  }

  // Test beacon dropdown query
  console.log("\n=== Test Beacon dropdown query (org 39) ===");
  try {
    const r4 = await c.query(`
      SELECT id, device_id, sequence_id, battery_level, status, assigned_to
      FROM schema1.institute_beacon
      WHERE allocated_to_org = $1 AND is_active = true
      ORDER BY device_id ASC
    `, [39]);
    console.log("Beacon count:", r4.rows.length);
    if (r4.rows.length > 0) console.table(r4.rows.slice(0, 3));
  } catch (e) {
    console.log("Beacon query FAILED:", e.message);
  }

  // Test active vehicles dropdown (the one that was already working)
  console.log("\n=== Test vehicle dropdown query (org 39) ===");
  try {
    const r5 = await c.query(`
      SELECT id, vehicle_number, model FROM schema1.institute_vehicles
      WHERE org_id = $1 AND status = 'Active'
      ORDER BY vehicle_number ASC
    `, [39]);
    console.log("Vehicle count:", r5.rows.length);
  } catch (e) {
    console.log("Vehicle query FAILED:", e.message);
  }

  c.release();
  await pool.end();
})();
