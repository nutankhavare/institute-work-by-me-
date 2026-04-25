import pool from "./src/lib/db";

async function checkComplianceTable() {
  try {
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'schema1' 
        AND table_name = 'institute_compliance'
      );
    `);
    console.log("Table institute_compliance exists:", result.rows[0].exists);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkComplianceTable();
