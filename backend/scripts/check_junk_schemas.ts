import pool from "./src/lib/db";

async function checkOtherSchemas() {
  try {
    const schemas = ['schemaa', 'schemas'];
    for (const schema of schemas) {
      const result = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1
        ORDER BY table_name;
      `, [schema]);
      console.log(`Tables in ${schema}:`);
      for (const row of result.rows) {
        const countResult = await pool.query(`SELECT COUNT(*) FROM "${schema}"."${row.table_name}"`);
        console.log(`- ${row.table_name}: ${countResult.rows[0].count} rows`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkOtherSchemas();
