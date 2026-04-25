import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  const client = new Client({
    connectionString: `postgresql://${process.env.PGUSER}:${encodeURIComponent(process.env.PGPASSWORD)}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`
  });
  
  try {
    await client.connect();
    console.log("Fixing tables...");

    await client.query("DROP TABLE IF EXISTS schema1.institute_broadcast_recipients");
    await client.query("DROP TABLE IF EXISTS schema1.institute_broadcasts");

    await client.query(`
        CREATE TABLE IF NOT EXISTS schema1.institute_broadcasts (
            id SERIAL PRIMARY KEY,
            org_id INTEGER NOT NULL,
            target_audience VARCHAR(50) NOT NULL, -- 'staff', 'drivers', 'everyone', 'individual'
            channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'
            subject VARCHAR(255),
            body TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'sending', 'sent', 'failed', 'scheduled'
            total_recipients INTEGER DEFAULT 0,
            delivered_count INTEGER DEFAULT 0,
            opened_count INTEGER DEFAULT 0,
            scheduled_at TIMESTAMP WITH TIME ZONE,
            sent_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await client.query(`
        CREATE TABLE IF NOT EXISTS schema1.institute_broadcast_recipients (
            id SERIAL PRIMARY KEY,
            broadcast_id INTEGER REFERENCES schema1.institute_broadcasts(id) ON DELETE CASCADE,
            recipient_type VARCHAR(20) NOT NULL, -- 'employee', 'driver'
            recipient_id INTEGER NOT NULL,
            recipient_name VARCHAR(100),
            recipient_email VARCHAR(255),
            recipient_phone VARCHAR(20),
            status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'delivered', 'failed', 'opened'
            sent_at TIMESTAMP WITH TIME ZONE,
            opened_at TIMESTAMP WITH TIME ZONE,
            error_message TEXT
        )
    `);

    console.log("Tables fixed successfully!");
  } catch (err) {
    console.error("Fix Error:", err);
  } finally {
    await client.end();
  }
}

fix();
