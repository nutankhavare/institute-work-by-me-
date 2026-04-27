import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool } from "../../shared/db";
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

      const result = await client.query(`
        SELECT COALESCE(SUM(delivered_count), 0) as total_sent
        FROM schema1.institute_broadcasts
        WHERE org_id = $1
      `, [token.org_id]);

      return ok({
        totalSent: parseInt(result.rows[0]?.total_sent ?? "0", 10)
      });
    } catch (e: any) {
      ctx.error("broadcastsStats error:", e.message);
      return ok({ totalSent: 0 }); // Always return 200 with default
    } finally {
      client?.release();
    }
  }
});
