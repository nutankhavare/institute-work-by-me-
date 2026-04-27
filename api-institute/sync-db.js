const { Pool } = require('pg');

const pool = new Pool({
  host: "vanloka-postgres.postgres.database.azure.com",
  port: 5432,
  user: "vanloka_admin",
  password: "MyNewPass@123",
  database: "postgres",
  ssl: { rejectUnauthorized: false }
});

const queries = [
    // 1. Create schema1 if not exists
    "CREATE SCHEMA IF NOT EXISTS schema1",

    // 2. institute_travellers
    `CREATE TABLE IF NOT EXISTS schema1.institute_travellers (
        id SERIAL PRIMARY KEY,
        org_id VARCHAR(50) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255),
        gender VARCHAR(20),
        email VARCHAR(255),
        phone VARCHAR(20),
        profile_photo TEXT,
        route VARCHAR(255),
        boarding_point VARCHAR(255),
        beacon_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 3. institute_bookings
    `CREATE TABLE IF NOT EXISTS schema1.institute_bookings (
        id SERIAL PRIMARY KEY,
        org_id VARCHAR(50) NOT NULL,
        traveller_id INTEGER REFERENCES schema1.institute_travellers(id),
        vehicle_id INTEGER,
        driver_id INTEGER,
        route VARCHAR(255),
        booking_date DATE,
        pickup_point VARCHAR(255),
        status VARCHAR(20) DEFAULT 'Pending',
        remarks TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 4. institute_organizations
    `CREATE TABLE IF NOT EXISTS schema1.institute_organizations (
        org_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255),
        type VARCHAR(100),
        registration_no VARCHAR(100),
        gst_number VARCHAR(20),
        pan_number VARCHAR(20),
        status VARCHAR(20) DEFAULT 'Active',
        subscription_plan VARCHAR(50),
        logo_url TEXT,
        address JSONB,
        contact JSONB,
        institute JSONB,
        documents JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 5. institute_devices
    `CREATE TABLE IF NOT EXISTS schema1.institute_devices (
        id SERIAL PRIMARY KEY,
        org_id VARCHAR(50) NOT NULL,
        device_id VARCHAR(100) UNIQUE NOT NULL,
        device_type VARCHAR(50), -- 'GPS', 'Beacon'
        serial_number VARCHAR(100),
        assigned_vehicle_id INTEGER,
        battery_percent INTEGER,
        last_seen TIMESTAMPTZ,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 6. Ensure users table exists for login (or use institute_employees/roles)
    // For now, I'll assume we can use institute_employees or a separate users table.
    // Let's create a simplified users table in schema1 if missing for auth.
    `CREATE TABLE IF NOT EXISTS schema1.users (
        id SERIAL PRIMARY KEY,
        org_id VARCHAR(50) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'ORG_ADMIN',
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMPTZ DEFAULT NOW()
    )`
];

async function sync() {
  const client = await pool.connect();
  try {
    console.log("Starting DB Sync for schema1...");
    for (const query of queries) {
        await client.query(query);
    }
    console.log("✅ Database tables initialized successfully.");
  } catch (err) {
    console.error("❌ DB Sync failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

sync();
