import pool from './src/lib/db';
import fs from 'fs';

async function exportFullPublicSample() {
  try {
    const targetTables = [
      'organizations',
      'users',
      'organization_address',
      'organization_contacts',
      'organization_documents',
      'organization_institute',
      'organization_mds',
      'organization_operations'
    ];
    
    const results: any = {};
    for (const table of targetTables) {
      try {
        const data = await pool.query(`SELECT * FROM public.${table} LIMIT 1`);
        results[table] = data.rows.length > 0 ? data.rows[0] : "NO_DATA";
      } catch (e) {
        results[table] = "ERROR: " + e.message;
      }
    }

    fs.writeFileSync('full_public_sample.json', JSON.stringify(results, null, 2));
    console.log('Full public sample exported.');
  } catch (err) {
    console.error("Export failed:", err);
  } finally {
    await pool.end();
  }
}

exportFullPublicSample();
