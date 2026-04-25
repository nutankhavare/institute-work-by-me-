# Postgres Connection & Migration Guide

This guide explains how to connect to a PostgreSQL database and how to use SQL migration files to create and manage your tables.

## 1. Prerequisites
You will need the `pg` (node-postgres) library:
```bash
npm install pg
npm install --save-dev @types/pg
```

## 2. Secure Configuration (.env)
Never hardcode your credentials. Create a `.env` file in your root directory:
```env
# Database Credentials
PGHOST=your-azure-db.postgres.database.azure.com
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=your_db_name
PGPORT=5432
PGSSLMODE=require
```

## 3. Creating the Connection Pool
Create a file (e.g., `db.ts`) to manage your connection. Using a **Pool** is better than a single **Client** because it handles multiple requests efficiently.

```typescript
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: Number(process.env.PGPORT),
  ssl: { rejectUnauthorized: false } // Required for Azure/Cloud DBs
});

export default pool;
```

## 4. How to Use Migration Files (Creating Tables)
Instead of creating tables manually, store your SQL in a `migrations/` folder. This ensures your friend has the exact same table structure as you.

### Step A: Create the SQL file
**File: `migrations/001_create_tables.sql`**
```sql
CREATE SCHEMA IF NOT EXISTS schema1;

CREATE TABLE schema1.users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step B: The "Run Migration" Script
Create a script (e.g., `run-migrations.ts`) that reads your SQL files and runs them.

```typescript
import fs from 'fs';
import path from 'path';
import pool from './db';

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    try {
      await pool.query(sql);
      console.log(`Successfully completed ${file}`);
    } catch (err) {
      console.error(`Error in ${file}:`, err);
      break;
    }
  }
  process.exit();
}

runMigrations();
```

## 5. Running a Query in your App
Once the tables are created, you can run queries like this:

```typescript
import pool from './db';

async function getUsers() {
  const { rows } = await pool.query('SELECT * FROM schema1.users');
  return rows;
}
```
