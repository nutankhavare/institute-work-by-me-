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

async function getOrgData(id: number) {
  const client = await pool.connect();
  try {
    const org = await client.query("SELECT * FROM organizations WHERE id = $1", [id]);
    const addr = await client.query("SELECT * FROM organization_address WHERE org_id = $1", [id]);
    const contact = await client.query("SELECT * FROM organization_contacts WHERE org_id = $1", [id]);
    const institute = await client.query("SELECT * FROM organization_institute WHERE org_id = $1", [id]);
    const docs = await client.query("SELECT * FROM organization_documents WHERE org_id = $1", [id]);

    console.log(JSON.stringify({
      main: org.rows[0] || "MISSING",
      address: addr.rows[0] || "MISSING",
      contact: contact.rows[0] || "MISSING",
      institute: institute.rows[0] || "MISSING",
      docs: docs.rows[0] || "MISSING"
    }, null, 2));

  } finally {
    client.release();
    await pool.end();
  }
}

getOrgData(32);
