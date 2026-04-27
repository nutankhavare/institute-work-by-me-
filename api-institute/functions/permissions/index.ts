import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

app.http("permissionsIndex", {
  route: "permissions",
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
      
      try {
        const result = await client.query(`
          SELECT * FROM schema1.institute_permissions 
          ORDER BY module_name, action
        `);
        
        const grouped = result.rows.reduce((acc: any, row) => {
          if (!acc[row.module_name]) {
            acc[row.module_name] = { module: row.module_name, permissions: [] };
          }
          acc[row.module_name].permissions.push({ 
            id: row.id, 
            action: row.action, 
            description: row.description 
          });
          return acc;
        }, {});

        return ok(Object.values(grouped));
      } catch (queryErr: any) {
        // Table may not exist yet — return empty array gracefully
        ctx.warn("permissionsIndex query failed (table may not exist):", queryErr.message);
        return ok([]);
      }
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});

