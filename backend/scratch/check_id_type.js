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
      WHERE table_schema = 'public' 
      AND table_name = 'organizations'
      AND column_name = 'id'
    `);
    console.log("Org ID Column:", res.rows[0]);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

check();
