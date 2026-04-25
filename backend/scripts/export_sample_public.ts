import pool from './src/lib/db';
import fs from 'fs';

async function exportSamplePublicData() {
  try {
    const results: any = {};
    
    // List of tables we want to sample
    const targetTables = ['organizations', 'users', 'office_branches', 'departments'];
    
    for (const table of targetTables) {
      try {
        const data = await pool.query(`SELECT * FROM public.${table} LIMIT 1`);
        if (data.rows.length > 0) {
          results[table] = data.rows[0];
        } else {
          results[table] = "NO_DATA";
        }
      } catch (e) {
        // Table might not exist
        results[table] = "TABLE_NOT_FOUND";
      }
    }

    fs.writeFileSync('public_sample_data.json', JSON.stringify(results, null, 2));
    console.log('Sample public data exported to public_sample_data.json');
  } catch (err) {
    console.error("Export failed:", err);
  } finally {
    await pool.end();
  }
}

exportSamplePublicData();
