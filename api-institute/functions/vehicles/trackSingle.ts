import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

app.http("vehiclesTrackSingle", {
  route: "vehicles/track/{vehicleNumber}/live/location/{tenantId}",
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;
      
      const { vehicleNumber, tenantId } = req.params;
      
      if (Number(tenantId) !== token.org_id) return err(403, "Forbidden");
      
      client = await getPool().connect();
      await withTenant(client, token.org_id);
      
      const result = await client.query(`
        SELECT t.*, v.vehicle_number, v.model, v.status as vehicle_status
        FROM schema1.institute_vehicle_telemetry t
        JOIN schema1.institute_vehicles v ON v.id = t.vehicle_id
        WHERE v.vehicle_number = $1 AND v.org_id = $2
        ORDER BY t.recorded_at DESC
        LIMIT 1
      `, [vehicleNumber, token.org_id]);
      
      if (result.rows.length === 0) return err(404, "Vehicle not found or no telemetry data");
      
      return ok(result.rows[0]);
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
