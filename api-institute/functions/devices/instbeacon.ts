import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

/* ─── GET /devices/beacons — list all Beacon devices for the org ─── */
app.http("instBeaconList", {
  route: "devices/beacons",
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      const result = await client.query(
        `SELECT id, device_id, sequence_id, allocated_to_org, assigned_to, assigned_type,
                assignment_locked, status, device_type, manufactured_at, manufactured_by,
                warranty_years, warranty_expiry, battery_level, battery_status, battery_type,
                expected_battery_life_days, device_health, is_active, created_at, synced_at
         FROM schema1.institute_beacon
         WHERE allocated_to_org = $1
         ORDER BY device_id ASC`,
        [token.org_id]
      );

      return ok(result.rows);
    } catch (e: any) {
      ctx.error(e);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});

/* ─── PUT /devices/beacons/{id} — update assignment ─── */
app.http("instBeaconUpdate", {
  route: "devices/beacons/{id}",
  methods: ["PUT", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;
      const deviceId = req.params.id;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      const body = (await req.json()) as any;

      const result = await client.query(
        `UPDATE schema1.institute_beacon SET
           assigned_to = COALESCE($3, assigned_to),
           assigned_type = COALESCE($4, assigned_type),
           synced_at = NOW()
         WHERE id = $1 AND allocated_to_org = $2
         RETURNING *`,
        [deviceId, token.org_id, body.assigned_to || null, body.assigned_type || null]
      );

      if (result.rows.length === 0) return err(404, "Beacon device not found");
      return ok(result.rows[0]);
    } catch (e: any) {
      ctx.error(e);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
