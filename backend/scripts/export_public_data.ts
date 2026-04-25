import pool from './src/lib/db';
import fs from 'fs';

async function exportPublicOrgData() {
  const orgId = '32';
  try {
    // 1. Get all tables in public schema
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    
    const results: any = {};

    for (const table of tables) {
      // Check if table has org_id or id column
      const colsRes = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
      `, [table]);
      const cols = colsRes.rows.map(r => r.column_name);

      let query = "";
      if (table === "organizations" && cols.includes("id")) {
        query = `SELECT * FROM public.${table} WHERE id = $1`;
      } else if (cols.includes("org_id")) {
        query = `SELECT * FROM public.${table} WHERE org_id = $1`;
      } else if (cols.includes("organization_id")) {
        query = `SELECT * FROM public.${table} WHERE organization_id = $1`;
      }

      if (query) {
        const data = await pool.query(query, [orgId]);
        if (data.rows.length > 0) {
          results[table] = data.rows;
        }
      }
    }

    fs.writeFileSync('public_org_32_data.json', JSON.stringify(results, null, 2));
    console.log('Public schema data exported to public_org_32_data.json');
  } catch (err) {
    console.error("Export failed:", err);
  } finally {
    await pool.end();
  }
}

exportPublicOrgData();
