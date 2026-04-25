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
    const res = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'schema1'");
    console.log("Tables in schema1:", res.rows.map(r => r.table_name));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

check();
