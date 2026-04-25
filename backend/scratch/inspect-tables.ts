import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: { rejectUnauthorized: false },
});

async function inspectTable(tableName: string) {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT * FROM ${tableName} LIMIT 1`);
    console.log(`Columns in ${tableName}:`, Object.keys(res.rows[0] || {}));
    console.log(`Sample data in ${tableName}:`, res.rows[0]);
  } catch (err: any) {
    console.error(`Error inspecting ${tableName}:`, err.message);
  } finally {
    client.release();
  }
}

async function run() {
  await inspectTable("organization_address");
  await inspectTable("organization_contacts");
  await inspectTable("organization_documents");
  await pool.end();
}

run();
