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
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const perPage = parseInt(url.searchParams.get("per_page") || "15", 10);
        const offset = (page - 1) * perPage;

        const countResult = await client.query(
          `SELECT COUNT(*) FROM schema1.institute_roles WHERE org_id = $1`,
          [token.org_id]
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const result = await client.query(`
          SELECT r.*, 
            COALESCE(
              json_agg(json_build_object('id', p.id, 'name', p.name)) 
              FILTER (WHERE p.id IS NOT NULL), '[]'::json
            ) as permission_objects 
          FROM schema1.institute_roles r 
          LEFT JOIN schema1.institute_permissions p 
            ON p.id::text = ANY(SELECT jsonb_array_elements_text(r.permissions)) 
          WHERE r.org_id = $1::text
          GROUP BY r.id
          ORDER BY r.created_at DESC
          LIMIT $2 OFFSET $3
        `, [String(token.org_id), perPage, offset]);

        return ok({
          data: result.rows,
          current_page: page,
          last_page: Math.ceil(total / perPage),
          per_page: perPage,
          total: total,
          from: total === 0 ? null : offset + 1,
          to: Math.min(page * perPage, total)
        });
      }

      if (req.method === "POST") {
        const body = await req.json() as any;
        const { name, department, access_level, permissions, status } = body;

        const result = await client.query(`
          INSERT INTO schema1.institute_roles (org_id, name, department, access_level, permissions, status)
          VALUES ($1, $2, $3, $4, $5::jsonb, $6)
          RETURNING *
        `, [
          token.org_id, 
          name, 
          department, 
          access_level || 'Partial Access', 
          JSON.stringify(permissions || []), 
          status || 'Active'
        ]);

        return ok(result.rows[0]);
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
