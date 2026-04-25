# MDS Database Structure & Query Locations

This document outlines how the database is structured, how connections are managed, and where SQL queries are executed in the current project.

## 1. Database Connection & Configuration
**File: `backend/src/lib/db.ts`**

This is the heart of the database layer. It performs the following:
- **Pool Initialization**: Uses the `pg` library to create a single connection pool.
- **Environment Variables**: Reads from `.env` (`DATABASE_URL` or discrete `PGHOST`, `PGUSER`, etc.).
- **SSL Configuration**: Automatically handles SSL requirements for Azure PostgreSQL.
- **RLS Helper**: Exports a `withRLS(orgId, callback)` function designed to set the `app.current_org_id` session variable before running a query, enabling Row-Level Security.

## 2. Main Query Locations

Currently, queries are executed in three primary areas:

### A. The Monolithic Server (`backend/src/server.ts`)
Most application logic and raw SQL queries are currently located here.
- **Dynamic Queries**: Uses `getTableColumns()` and `toPayload()` helpers to dynamically construct `INSERT` and `UPDATE` statements.
- **Manual Isolation**: Most `SELECT` queries manually append `WHERE org_id = $1` to filter data by organization.
- **Transaction Management**: Uses `BEGIN`, `COMMIT`, and `ROLLBACK` for complex operations (like creating an employee with dependants).

### B. Azure Functions (`backend/src/functions/*.ts`)
Newer endpoints follow the Azure Functions v4 model and run queries independently.
- **`auth.ts`**: Handles login verification and token generation by querying the `users` table.
- **`staff.ts`**: Contains CRUD logic for staff management.
- **`stats.ts`**: Runs aggregated queries (`COUNT`, `SUM`) for the dashboard.
- **`vehicles.ts`**: Handles vehicle-related queries.

### C. Maintenance & Setup Scripts (`backend/src/*.ts`)
These are one-off scripts for database administration:
- **`run-migration.ts`**: Reads files from `backend/migrations/` and executes them.
- **`seed-permissions.ts`**: populates the permissions tables.
- **`check-db.ts`**: Simple connectivity and schema verification test.

## 3. Schema & Migrations
**Directory: `backend/migrations/`**

Schema changes are tracked as raw SQL files:
- **`001_create_schema1_tables.sql`**: Initial setup of the `schema1` schema and primary tables (employees, vehicles, drivers).
- **`002_institute_v2_expansion.sql`**: Updates and new columns for expanded features.

## 4. Query Execution Pattern

The typical pattern for running a query in the backend is:

1. **Get a client from the pool**:
   ```typescript
   const client = await pool.connect();
   ```
2. **Execute the query**:
   ```typescript
   const { rows } = await client.query('SELECT * FROM users WHERE email = $1', [email]);
   ```
3. **Release the client**:
   ```typescript
   client.release();
   ```

---

### **Planned Improvement (as per Guide)**
To align with the architecture guide, all queries should eventually move into **Azure Functions** and use the **`withRLS`** wrapper to ensure that `SET app.current_tenant` is called on every connection, providing a consistent security layer.
