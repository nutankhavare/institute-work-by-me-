import { Pool } from 'pg';

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_n9mEPeS1ZzUr@ep-curly-rain-a576y68u-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require",
});

async function check() {
  const tables = ['organization_address', 'organization_contacts'];
  for (const table of tables) {
    console.log(`\n--- Constraints for ${table} ---`);
    const res = await pool.query(`
      SELECT conname, contype, pg_get_constraintdef(c.oid) 
      FROM pg_constraint c 
      JOIN pg_namespace n ON n.oid = c.connamespace 
      WHERE n.nspname = 'public' AND conrelid = $1::regclass
    `, [table]);
    console.table(res.rows);
  }
  await pool.end();
}

check();
