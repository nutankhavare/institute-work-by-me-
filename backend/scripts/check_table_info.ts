import pool from "./src/lib/db";

async function checkTableInfo(tableName: string) {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'schema1' AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    console.log(`Columns in ${tableName}:`);
    result.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

const table = process.argv[2];
if (!table) {
  console.log("Usage: bun run check_table_info.ts <tableName>");
  process.exit(1);
}
checkTableInfo(table);
