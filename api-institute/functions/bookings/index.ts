import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

app.http("bookingsIndex", {
  route: "bookings",
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
          SELECT COUNT(*) FROM schema1.institute_bookings b
          LEFT JOIN schema1.institute_travellers t ON t.id = b.traveller_id
          WHERE b.org_id = $1
            AND ($2::text IS NULL OR b.status = $2)
            AND ($3::text IS NULL OR (
              b.id::text ILIKE '%' || $3 || '%' OR
              (t.first_name || ' ' || t.last_name) ILIKE '%' || $3 || '%'
            ))
        `, [token.org_id, status, search]);
        const total = parseInt(countResult.rows[0].count, 10);

        const result = await client.query(`
          SELECT b.*,
            t.first_name || ' ' || t.last_name as traveller_name, t.phone as traveller_phone,
            v.vehicle_number, v.model as vehicle_model
          FROM schema1.institute_bookings b
          LEFT JOIN schema1.institute_travellers t ON t.id = b.traveller_id
          LEFT JOIN schema1.institute_vehicles v ON v.id = b.vehicle_id
          WHERE b.org_id = $1
            AND ($2::text IS NULL OR b.status = $2)
            AND ($3::text IS NULL OR (
              b.id::text ILIKE '%' || $3 || '%' OR
              (t.first_name || ' ' || t.last_name) ILIKE '%' || $3 || '%'
            ))
          ORDER BY b.created_at DESC
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
        const body = await req.json() as any;
        
        const result = await client.query(`
          INSERT INTO schema1.institute_bookings (
            org_id, traveller_id, vehicle_id, route, 
            booking_date, pickup_point, status, remarks
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8
          ) RETURNING *
        `, [
          token.org_id, 
          body.traveller_id ? parseInt(body.traveller_id) : null, 
          body.vehicle_id ? parseInt(body.vehicle_id) : null, 
          body.route, 
          body.booking_date || null, 
          body.pickup_point, 
          body.status || 'Pending', 
          body.remarks
        ]);

        return ok(result.rows[0]);
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      if (e.code === "23503") return err(404, "Related record not found");
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
