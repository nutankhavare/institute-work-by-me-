import { Pool, PoolClient } from "pg";

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.PG_HOST,
      port: parseInt(process.env.PG_PORT || "5432"),
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return _pool;
}

export async function withTenant(client: PoolClient, orgId: number) {
  // Validate orgId is a real number to prevent injection
  const sanitized = Number(orgId);
  if (!Number.isFinite(sanitized) || sanitized <= 0) {
    throw new Error("Invalid org_id");
  }
  // Use set_config() with parameterized value — immune to SQL injection
  await client.query(
    `SELECT set_config('app.current_org_id', $1, false)`,
    [String(sanitized)]
  );
}
