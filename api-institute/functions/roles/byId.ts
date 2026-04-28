import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

app.http("rolesById", {
  route: "roles/{id}",
  methods: ["GET", "PUT", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;
      const roleId = req.params.id;

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
          WHERE r.id = $1 AND r.org_id = $2::text 
          GROUP BY r.id
        `, [roleId, String(token.org_id)]);

        if (result.rows.length === 0) return err(404, "Role not found");
        return ok(result.rows[0]);
      }

      if (req.method === "PUT") {
        const body = await req.json() as any;
        const { name, department, access_level, permissions, status } = body;

        const result = await client.query(`
          UPDATE schema1.institute_roles SET
            name = COALESCE($3, name),
            department = COALESCE($4, department),
            access_level = COALESCE($5, access_level),
            permissions = COALESCE($6::jsonb, permissions),
            status = COALESCE($7, status),
            updated_at = NOW()
          WHERE id = $1 AND org_id = $2::text
          RETURNING *
        `, [
          roleId, 
          String(token.org_id), 
          name, 
          department, 
          access_level, 
          permissions ? JSON.stringify(permissions) : null, 
          status
        ]);

        if (result.rows.length === 0) return err(404, "Role not found");
        return ok(result.rows[0]);
      }

      if (req.method === "DELETE") {
        const result = await client.query(
          `DELETE FROM schema1.institute_roles WHERE id = $1 AND org_id = $2::text`,
          [roleId, String(token.org_id)]
        );

        if (result.rowCount === 0) return err(404, "Role not found");
        return ok({ deleted: true });
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      if (e.code === "23505") return err(409, "Record already exists");
      if (e.code === "23503") return err(404, "Related record not found");
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
