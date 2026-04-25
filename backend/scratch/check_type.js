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
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'schema1' 
      AND table_name = 'institute_organizations' 
      AND column_name = 'org_id'
    `);
    console.log("Org ID Type:", res.rows[0]);

    const sample = await client.query("SELECT org_id FROM schema1.institute_organizations LIMIT 1");
    console.log("Sample Org ID:", sample.rows[0]);

  } catch (err) {
    console.error("Check Error:", err);
  } finally {
    await client.end();
  }
}

check();
