import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

app.http("broadcastsById", {
  route: "broadcasts/{id}",
  methods: ["GET", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;
      const broadcastId = req.params.id;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      if (req.method === "GET") {
        const broadcastResult = await client.query(`
          SELECT * FROM schema1.institute_broadcasts 
          WHERE id = $1 AND org_id = $2
        `, [broadcastId, token.org_id]);

        if (broadcastResult.rows.length === 0) return err(404, "Broadcast not found");

        const recipientsResult = await client.query(`
          SELECT * FROM schema1.institute_broadcast_recipients 
          WHERE broadcast_id = $1 
          ORDER BY created_at ASC
        `, [broadcastId]);

        return ok({
          ...broadcastResult.rows[0],
          recipients: recipientsResult.rows
        });
      }

      if (req.method === "DELETE") {
        const result = await client.query(`
          DELETE FROM schema1.institute_broadcasts 
          WHERE id = $1 AND org_id = $2
        `, [broadcastId, token.org_id]);

        if (result.rowCount === 0) return err(404, "Broadcast not found");
        return ok({ deleted: true });
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
