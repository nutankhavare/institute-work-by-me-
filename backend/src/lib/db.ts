import "dotenv/config";
import { Pool } from "pg";
import type { PoolClient } from "pg";

const databaseUrl = process.env.DATABASE_URL;
const host = process.env.PGHOST;
const port = process.env.PGPORT ? Number(process.env.PGPORT) : undefined;
const user = process.env.PGUSER;
const password = process.env.PGPASSWORD;
const database = process.env.PGDATABASE;

const hasDiscretePgConfig = Boolean(host && user && password && database);
const hasConnectionString = Boolean(databaseUrl);
const canInitializePool = hasDiscretePgConfig || hasConnectionString;

if (!canInitializePool) {
  console.warn("[db] PostgreSQL configuration not found. Backend will run in fallback mode until DB credentials are provided.");
}

if (hasDiscretePgConfig && String(password).includes("REPLACE_WITH_")) {
  console.warn("[db] PGPASSWORD is still a placeholder. Backend will run in fallback mode until real DB password is set.");
}

if (!hasDiscretePgConfig && databaseUrl?.startsWith("prisma+postgres://")) {
  console.warn(
    "[db] DATABASE_URL uses prisma+postgres protocol. Provide Azure PG URL or PG* vars. Running in fallback mode.",
  );
}

const sslMode = (process.env.PGSSLMODE || "").toLowerCase();
const useSsl =
  sslMode === "require" ||
  sslMode === "verify-ca" ||
  sslMode === "verify-full" ||
  databaseUrl?.includes("sslmode=require") ||
  databaseUrl?.includes("sslmode=verify-full");

const sslConfig = useSsl
  ? {
      // Azure Database for PostgreSQL requires TLS.
      // Keep this false unless you provide and validate a CA cert.
      rejectUnauthorized: false,
    }
  : undefined;

type PoolLike = Pick<Pool, "query" | "connect">;

const disabledPool: PoolLike = {
  query: async () => {
    throw new Error("PostgreSQL is not configured. Set valid Azure credentials in backend/.env");
  },
  connect: async () => {
    throw new Error("PostgreSQL is not configured. Set valid Azure credentials in backend/.env");
  },
};

const pool: PoolLike =
  canInitializePool && !(hasDiscretePgConfig && String(password).includes("REPLACE_WITH_")) && !databaseUrl?.startsWith("prisma+postgres://")
    ? hasDiscretePgConfig
      ? new Pool({
          host,
          port: port ?? 5432,
          user,
          password,
          database,
          ssl: sslConfig,
          max: 20, // Increased capacity
          connectionTimeoutMillis: 10000, // 10s timeout to prevent hanging
          idleTimeoutMillis: 30000, // Close idle connections after 30s
        })
      : new Pool({
          connectionString: databaseUrl,
          ssl: sslConfig,
          max: 20,
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 30000,
        })
    : disabledPool;

/**
 * Execute a database operation with Row-Level Security (RLS) enabled.
 * It first sets the organization ID in the session, then executes the callback.
 */
export async function withRLS<T>(orgId: string, callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = (await pool.connect()) as PoolClient;
  try {
    // 1. Set the organization ID for this session
    await client.query(`SET app.current_org_id = $1`, [orgId]);
    
    // 2. Execute the business logic
    return await callback(client);
  } finally {
    // 3. Always release the client back to the pool
    client.release();
  }
}

export default pool as Pool;
