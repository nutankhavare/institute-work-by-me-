import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

app.http("broadcastsStats", {
  route: "broadcasts/stats",
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

      const result = await client.query(`
        SELECT 
          COALESCE(SUM(delivered_count), 0) as total_sent,
          CASE WHEN SUM(delivered_count) > 0 
            THEN ROUND(SUM(opened_count)::numeric / SUM(delivered_count) * 100) 
            ELSE 0 
          END as open_rate
        FROM schema1.institute_broadcasts
        WHERE org_id = $1
      `, [token.org_id]);

      const data = {
        totalSent: parseInt(result.rows[0].total_sent, 10),
        openRate: parseInt(result.rows[0].open_rate, 10)
      };

      return ok(data);
    } catch (e: any) {
      ctx.error(e);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
