import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

app.http("rolesIndex", {
  route: "roles",
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
        const result = await client.query(`
          SELECT r.*, 
            COALESCE(
              json_agg(json_build_object('id', p.id, 'name', p.name)) 
              FILTER (WHERE p.id IS NOT NULL), '[]'::json
            ) as permissions 
          FROM schema1.institute_roles r 
          LEFT JOIN schema1.institute_permissions p 
            ON p.id::text = ANY(SELECT jsonb_array_elements_text(r.permissions)) 
          WHERE r.org_id = $1::text
          GROUP BY r.id
          ORDER BY r.created_at DESC
        `, [String(token.org_id)]);

        return ok(result.rows);
      }

      if (req.method === "POST") {
        const body = await req.json() as any;
        const { name, department, access_level, description, permissions, status } = body;

        const result = await client.query(`
          INSERT INTO schema1.institute_roles (org_id, name, department, access_level, description, permissions, status)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)
          RETURNING *
        `, [
          String(token.org_id), 
          name, 
          department || null,
          access_level || 'Partial Access',
          description || null,
          JSON.stringify(permissions || []), 
          status || 'Active'
        ]);

        return ok(result.rows[0]);
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      if (e.code === "23505") return err(409, "Role already exists");
      if (e.code === "23503") return err(404, "Related record not found");
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
