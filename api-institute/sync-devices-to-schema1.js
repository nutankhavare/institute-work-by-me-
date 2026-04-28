const { Pool } = require('pg');

const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

const TARGET_ORGS = [39, 40, 41];

async function syncDevices() {
  const client = await pool.connect();
  try {
    // ─── 1. Sync GPS Devices ──────────────────────────────────────────
    console.log("═══ Syncing GPS Devices from public.orggps → schema1.institute_gps ═══");

    const gpsResult = await client.query(
      `SELECT * FROM public.orggps WHERE allocated_to_org = ANY($1)`,
      [TARGET_ORGS]
    );
    console.log(`Found ${gpsResult.rows.length} GPS devices to sync`);

    for (const gps of gpsResult.rows) {
      await client.query(`
        INSERT INTO schema1.institute_gps (
          id, device_id, sim_number, network_provider, device_health, status,
          allocated_to_org, assigned_to, assigned_type, last_known_location,
          last_ping, is_active, synced_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, NOW())
        ON CONFLICT (id) DO UPDATE SET
          device_id = EXCLUDED.device_id,
          sim_number = EXCLUDED.sim_number,
          network_provider = EXCLUDED.network_provider,
          device_health = EXCLUDED.device_health,
          status = EXCLUDED.status,
          allocated_to_org = EXCLUDED.allocated_to_org,
          assigned_to = EXCLUDED.assigned_to,
          assigned_type = EXCLUDED.assigned_type,
          last_known_location = EXCLUDED.last_known_location,
          last_ping = EXCLUDED.last_ping,
          is_active = EXCLUDED.is_active,
          synced_at = NOW()
      `, [
        gps.id, gps.device_id, gps.sim_number, gps.network_provider,
        gps.device_health, gps.status, gps.allocated_to_org,
        gps.assigned_to, gps.assigned_type, gps.last_known_location,
        gps.last_ping, gps.is_active
      ]);
    }
    console.log(`✅ Synced ${gpsResult.rows.length} GPS devices\n`);

    // ─── 2. Sync Beacon Devices ───────────────────────────────────────
    console.log("═══ Syncing Beacon Devices from public.orgbeacon → schema1.institute_beacon ═══");

    const beaconResult = await client.query(
      `SELECT * FROM public.orgbeacon WHERE allocated_to_org = ANY($1)`,
      [TARGET_ORGS]
    );
    console.log(`Found ${beaconResult.rows.length} Beacon devices to sync`);

    for (const beacon of beaconResult.rows) {
      await client.query(`
        INSERT INTO schema1.institute_beacon (
          id, device_id, sequence_id, allocated_to_org, assigned_to, assigned_type,
          assignment_locked, status, device_type, manufactured_at, manufactured_by,
          warranty_years, warranty_expiry, battery_level, battery_status, battery_type,
          expected_battery_life_days, device_health, is_active, created_at, synced_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20, NOW())
        ON CONFLICT (id) DO UPDATE SET
          device_id = EXCLUDED.device_id,
          sequence_id = EXCLUDED.sequence_id,
          allocated_to_org = EXCLUDED.allocated_to_org,
          assigned_to = EXCLUDED.assigned_to,
          assigned_type = EXCLUDED.assigned_type,
          assignment_locked = EXCLUDED.assignment_locked,
          status = EXCLUDED.status,
          device_type = EXCLUDED.device_type,
          manufactured_at = EXCLUDED.manufactured_at,
          manufactured_by = EXCLUDED.manufactured_by,
          warranty_years = EXCLUDED.warranty_years,
          warranty_expiry = EXCLUDED.warranty_expiry,
          battery_level = EXCLUDED.battery_level,
          battery_status = EXCLUDED.battery_status,
          battery_type = EXCLUDED.battery_type,
          expected_battery_life_days = EXCLUDED.expected_battery_life_days,
          device_health = EXCLUDED.device_health,
          is_active = EXCLUDED.is_active,
          synced_at = NOW()
      `, [
        beacon.id, beacon.device_id, beacon.sequence_id, beacon.allocated_to_org,
        beacon.assigned_to, beacon.assigned_type, beacon.assignment_locked,
        beacon.status, beacon.device_type, beacon.manufactured_at, beacon.manufactured_by,
        beacon.warranty_years, beacon.warranty_expiry, beacon.battery_level,
        beacon.battery_status, beacon.battery_type, beacon.expected_battery_life_days,
        beacon.device_health, beacon.is_active, beacon.created_at
      ]);
    }
    console.log(`✅ Synced ${beaconResult.rows.length} Beacon devices\n`);

    // ─── 3. Verify ────────────────────────────────────────────────────
    console.log("═══════════════════════════════════════════════════");
    console.log("  VERIFICATION");
    console.log("═══════════════════════════════════════════════════");

    for (const orgId of TARGET_ORGS) {
      const gpsCount = await client.query(
        `SELECT COUNT(*) FROM schema1.institute_gps WHERE allocated_to_org = $1`, [orgId]
      );
      const beaconCount = await client.query(
        `SELECT COUNT(*) FROM schema1.institute_beacon WHERE allocated_to_org = $1`, [orgId]
      );
      console.log(`  Org ${orgId}: ${gpsCount.rows[0].count} GPS | ${beaconCount.rows[0].count} Beacons`);
    }
    console.log("═══════════════════════════════════════════════════");

  } catch (err) {
    console.error("❌ Sync failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

syncDevices();
