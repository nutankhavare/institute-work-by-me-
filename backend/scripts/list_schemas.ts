import pool from "./src/lib/db";

async function listSchemas() {
  try {
    const result = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata
      WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'
      ORDER BY schema_name;
    `);
    console.log("Schemas:");
    result.rows.forEach(row => console.log("- " + row.schema_name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listSchemas();
