import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  const client = new Client({
    connectionString: `postgresql://${process.env.PGUSER}:${encodeURIComponent(process.env.PGPASSWORD)}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`
  });
  
  try {
    await client.connect();
    console.log("Connected to DB");
    
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'schema1' 
      AND table_name IN ('institute_broadcasts', 'institute_broadcast_recipients', 'institute_employees', 'institute_drivers')
    `);
    console.log("Tables found:", tables.rows.map(r => r.table_name));

    const staffCount = await client.query("SELECT COUNT(*) FROM schema1.institute_employees WHERE email IS NOT NULL");
    console.log("Staff with emails:", staffCount.rows[0].count);

    const driverCount = await client.query("SELECT COUNT(*) FROM schema1.institute_drivers WHERE email IS NOT NULL");
    console.log("Drivers with emails:", driverCount.rows[0].count);

    const lastBroadcast = await client.query("SELECT * FROM schema1.institute_broadcasts ORDER BY created_at DESC LIMIT 1");
    console.log("Last Broadcast Status:", lastBroadcast.rows[0]?.status);
    console.log("Last Broadcast Error Info:", lastBroadcast.rows[0]);

  } catch (err) {
    console.error("Check Error:", err);
  } finally {
    await client.end();
  }
}

check();
