import pool from "./src/lib/db";

async function listPublicTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    console.log("Tables in public:");
    result.rows.forEach(row => console.log("- " + row.table_name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listPublicTables();
