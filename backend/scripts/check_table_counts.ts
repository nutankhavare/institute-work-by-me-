import pool from "./src/lib/db";

async function listTableCounts() {
  try {
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'schema1'
      ORDER BY table_name;
    `);
    
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      const countResult = await pool.query(`SELECT COUNT(*) FROM schema1."${tableName}"`);
      console.log(`- ${tableName}: ${countResult.rows[0].count} rows`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listTableCounts();
