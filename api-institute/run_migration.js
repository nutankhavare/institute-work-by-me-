const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Helper to get settings from Azure Functions local.settings.json format
const settings = JSON.parse(fs.readFileSync(path.join(__dirname, 'local.settings.json'), 'utf8'));
const env = settings.Values;

async function migrate() {
  const client = new Client({
    host: env.PG_HOST,
    port: parseInt(env.PG_PORT || '5432'),
    user: env.PG_USER,
    password: env.PG_PASSWORD,
    database: env.PG_DATABASE,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Azure PostgreSQL...');

    const migrationSql = fs.readFileSync(path.join(__dirname, 'migrations', '001_broadcasts.sql'), 'utf8');
    
    console.log('Running migration: 001_broadcasts.sql...');
    await client.query(migrationSql);
    
    console.log('✅ Migration successful! Tables created in schema1.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await client.end();
  }
}

migrate();
