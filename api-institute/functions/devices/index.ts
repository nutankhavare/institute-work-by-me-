import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

app.http("devicesIndex", {
  route: "devices",
  methods: ["GET", "POST", "OPTIONS"],
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

      if (req.method === "GET") {
        const result = await client.query(
          `SELECT * FROM schema1.institute_devices WHERE org_id = $1::text ORDER BY created_at DESC`,
          [String(token.org_id)]
        );
        return ok(result.rows);
      }

      if (req.method === "POST") {
        const body = (await req.json()) as any;
        const result = await client.query(
          `INSERT INTO schema1.institute_devices (org_id, device_id, device_type, serial_number, assigned_vehicle_id, status)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [String(token.org_id), body.device_id, body.device_type, body.serial_number, body.assigned_vehicle_id, body.status || 'Active']
        );
        return ok(result.rows[0]);
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
