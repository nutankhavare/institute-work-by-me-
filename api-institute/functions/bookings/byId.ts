import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

app.http("bookingsById", {
  route: "bookings/{id}",
  methods: ["GET", "PUT", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;
      const bookingId = req.params.id;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      if (req.method === "GET") {
        const result = await client.query(`
          SELECT b.*,
            t.first_name || ' ' || t.last_name as traveller_name, t.phone, t.email,
            v.vehicle_number, v.model, v.seating_capacity
          FROM schema1.institute_bookings b
          LEFT JOIN schema1.institute_travellers t ON t.id = b.traveller_id
          LEFT JOIN schema1.institute_vehicles v ON v.id = b.vehicle_id
          WHERE b.id = $1 AND b.org_id = $2
        `, [bookingId, token.org_id]);

        if (result.rows.length === 0) return err(404, "Booking not found");

        const vehiclesResult = await client.query(`
          SELECT id, vehicle_number, model, seating_capacity
          FROM schema1.institute_vehicles
          WHERE org_id = $1 AND status = 'Active'
          ORDER BY vehicle_number
        `, [token.org_id]);

        return ok({ 
          booking: result.rows[0], 
          vehicles: vehiclesResult.rows 
        });
      }

      if (req.method === "PUT") {
        const body = await req.json() as any;

        const result = await client.query(`
          UPDATE schema1.institute_bookings SET
            vehicle_id = COALESCE($3, vehicle_id),
            traveller_id = COALESCE($4, traveller_id),
            route = COALESCE($5, route),
            booking_date = COALESCE($6, booking_date),
            pickup_point = COALESCE($7, pickup_point),
            status = COALESCE($8, status),
            remarks = COALESCE($9, remarks),
            updated_at = NOW()
          WHERE id = $1 AND org_id = $2
          RETURNING *
        `, [
          bookingId, 
          token.org_id, 
          body.vehicle_id ? parseInt(body.vehicle_id) : null,
          body.traveller_id ? parseInt(body.traveller_id) : null,
          body.route,
          body.booking_date,
          body.pickup_point,
          body.status,
          body.remarks
        ]);

        if (result.rows.length === 0) return err(404, "Booking not found");
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
