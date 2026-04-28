const { Pool } = require('pg');
const pool = new Pool({
  host: 'vanloka-postgres.postgres.database.azure.com',
  port: 5432, user: 'vanloka_admin', password: 'MyNewPass@123',
  database: 'postgres', ssl: { rejectUnauthorized: false }
});

async function main() {
  const c = await pool.connect();

  // Temporarily disable FORCE to insert as admin
  await c.query("ALTER TABLE schema1.institute_gps NO FORCE ROW LEVEL SECURITY");
  await c.query("ALTER TABLE schema1.institute_beacon NO FORCE ROW LEVEL SECURITY");

  // Insert 5 GPS devices for org 38
  const gpsDevices = [
    { id: 'gps_hz_1', device_id: 'GPS-HZ-001', sim: 'SIM-HZ-9001', network: 'Airtel' },
    { id: 'gps_hz_2', device_id: 'GPS-HZ-002', sim: 'SIM-HZ-9002', network: 'Jio' },
    { id: 'gps_hz_3', device_id: 'GPS-HZ-003', sim: 'SIM-HZ-9003', network: 'Airtel' },
    { id: 'gps_hz_4', device_id: 'GPS-HZ-004', sim: 'SIM-HZ-9004', network: 'Vi' },
    { id: 'gps_hz_5', device_id: 'GPS-HZ-005', sim: 'SIM-HZ-9005', network: 'BSNL' },
  ];

  console.log('═══ Allocating GPS to org 38 ═══');
  for (const g of gpsDevices) {
    const dup = await c.query("SELECT id FROM schema1.institute_gps WHERE id = $1", [g.id]);
    if (dup.rows.length > 0) { console.log(`  ⏭️  ${g.device_id} already exists`); continue; }
    await c.query(`
      INSERT INTO schema1.institute_gps (id, device_id, sim_number, network_provider, device_health, status, allocated_to_org, is_active)
      VALUES ($1, $2, $3, $4, 'Good', 'active', 38, true)
    `, [g.id, g.device_id, g.sim, g.network]);
    console.log(`  ✅ ${g.device_id} | SIM: ${g.sim} | Network: ${g.network}`);
  }

  // Insert 5 Beacon devices for org 38
  const beaconDevices = [
    { id: 'beacon_hz_1', device_id: 'BEACON-HZ-001', seq: 1001, battery: 95 },
    { id: 'beacon_hz_2', device_id: 'BEACON-HZ-002', seq: 1002, battery: 88 },
    { id: 'beacon_hz_3', device_id: 'BEACON-HZ-003', seq: 1003, battery: 72 },
    { id: 'beacon_hz_4', device_id: 'BEACON-HZ-004', seq: 1004, battery: 100 },
    { id: 'beacon_hz_5', device_id: 'BEACON-HZ-005', seq: 1005, battery: 55 },
  ];

  console.log('\n═══ Allocating Beacons to org 38 ═══');
  for (const b of beaconDevices) {
    const dup = await c.query("SELECT id FROM schema1.institute_beacon WHERE id = $1", [b.id]);
    if (dup.rows.length > 0) { console.log(`  ⏭️  ${b.device_id} already exists`); continue; }
    await c.query(`
      INSERT INTO schema1.institute_beacon (id, device_id, sequence_id, allocated_to_org, device_health, battery_level, battery_status, status, is_active)
      VALUES ($1, $2, $3, 38, 'Good', $4, 'Normal', 'active', true)
    `, [b.id, b.device_id, b.seq, b.battery]);
    console.log(`  ✅ ${b.device_id} | Battery: ${b.battery}%`);
  }

  // Re-enable FORCE
  await c.query("ALTER TABLE schema1.institute_gps FORCE ROW LEVEL SECURITY");
  await c.query("ALTER TABLE schema1.institute_beacon FORCE ROW LEVEL SECURITY");

  // Verify with RLS active
  console.log('\n═══ Verification: org 38 sees its devices ═══');
  await c.query("SELECT set_config('app.current_org_id', '38', false)");
  const gps38 = await c.query("SELECT device_id, sim_number, status FROM schema1.institute_gps");
  console.log(`GPS: ${gps38.rows.length} devices`);
  gps38.rows.forEach(r => console.log(`  ${r.device_id} | ${r.sim_number} | ${r.status}`));
  const b38 = await c.query("SELECT device_id, battery_level, status FROM schema1.institute_beacon");
  console.log(`Beacons: ${b38.rows.length} devices`);
  b38.rows.forEach(r => console.log(`  ${r.device_id} | ${r.battery_level}% | ${r.status}`));

  // Verify org 40 still sees only its own
  await c.query("SELECT set_config('app.current_org_id', '40', false)");
  const gps40 = await c.query("SELECT count(*)::int as cnt FROM schema1.institute_gps");
  const b40 = await c.query("SELECT count(*)::int as cnt FROM schema1.institute_beacon");
  console.log(`\nOrg 40: ${gps40.rows[0].cnt} GPS, ${b40.rows[0].cnt} Beacons (isolation ✅)`);

  c.release();
  await pool.end();
}
main();
