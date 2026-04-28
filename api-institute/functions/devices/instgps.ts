import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

/* ─── GET /devices/gps — list all GPS devices for the org ─── */
app.http("instGpsList", {
  route: "devices/gps",
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
        `SELECT id, device_id, sim_number, network_provider, device_health,
                status, allocated_to_org, assigned_to, assigned_type,
                last_known_location, last_ping, is_active, synced_at
         FROM schema1.institute_gps
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

/* ─── PUT /devices/gps/{id} — update assignment ─── */
app.http("instGpsUpdate", {
  route: "devices/gps/{id}",
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
        `UPDATE schema1.institute_gps SET
           assigned_to = COALESCE($3, assigned_to),
           assigned_type = COALESCE($4, assigned_type),
           synced_at = NOW()
         WHERE id = $1 AND allocated_to_org = $2
         RETURNING *`,
        [deviceId, token.org_id, body.assigned_to || null, body.assigned_type || null]
      );

      if (result.rows.length === 0) return err(404, "GPS device not found");
      return ok(result.rows[0]);
    } catch (e: any) {
      ctx.error(e);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
