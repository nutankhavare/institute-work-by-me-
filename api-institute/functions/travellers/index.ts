import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";

app.http("travellersIndex", {
  route: "travellers",
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
        const search = url.searchParams.get("search") || null;
        const status = url.searchParams.get("status") || null;
        const offset = (page - 1) * perPage;

        const countResult = await client.query(`
          SELECT COUNT(*) FROM schema1.institute_travellers
          WHERE org_id = $1
            AND ($2::text IS NULL OR status = $2)
            AND ($3::text IS NULL OR (
              first_name ILIKE '%' || $3 || '%' OR
              last_name ILIKE '%' || $3 || '%' OR
              phone ILIKE '%' || $3 || '%' OR
              email ILIKE '%' || $3 || '%'
            ))
        `, [token.org_id, status, search]);
        const total = parseInt(countResult.rows[0].count, 10);

        const result = await client.query(`
          SELECT *
          FROM schema1.institute_travellers
          WHERE org_id = $1
            AND ($2::text IS NULL OR status = $2)
            AND ($3::text IS NULL OR (
              first_name ILIKE '%' || $3 || '%' OR
              last_name ILIKE '%' || $3 || '%' OR
              phone ILIKE '%' || $3 || '%' OR
              email ILIKE '%' || $3 || '%'
            ))
          ORDER BY created_at DESC
          LIMIT $4 OFFSET $5
        `, [token.org_id, status, search, perPage, offset]);

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
        const contentType = req.headers.get("content-type") || "";
        let body: any;

        if (contentType.includes("multipart/form-data")) {
          const { fields } = await parseMultipart(req);
          body = fields;
        } else {
          body = await req.json();
        }

        const result = await client.query(`
          INSERT INTO schema1.institute_travellers (
            org_id, first_name, last_name, email, phone, 
            route, boarding_point, beacon_id, status
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9
          ) RETURNING *
        `, [
          token.org_id, body.first_name, body.last_name, body.email, body.phone, 
          body.route, body.boarding_point, body.beacon_id, body.status || 'Active'
        ]);

        return ok(result.rows[0]);
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      if (e.code === "23505") return err(409, "Traveller already exists");
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
