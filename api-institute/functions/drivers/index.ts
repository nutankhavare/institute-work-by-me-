import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";
import { uploadToBlob } from "../../shared/blob";

app.http("driversIndex", {
  route: "drivers",
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
          SELECT COUNT(*) FROM schema1.institute_drivers
          WHERE org_id = $1
            AND ($2::text IS NULL OR status = $2)
            AND ($3::text IS NULL OR (
              first_name ILIKE '%' || $3 || '%' OR
              last_name ILIKE '%' || $3 || '%' OR
              mobile_number ILIKE '%' || $3 || '%' OR
              employee_id ILIKE '%' || $3 || '%' OR
              email ILIKE '%' || $3 || '%'
            ))
        `, [token.org_id, status, search]);
        const total = parseInt(countResult.rows[0].count, 10);

        const result = await client.query(`
          SELECT d.*,
            li.number as dl_number, li.exp_date as dl_expiry_date, li.type as license_type,
            v.vehicle_number as assigned_vehicle_number
          FROM schema1.institute_drivers d
          LEFT JOIN schema1.institute_driver_license_insurance li ON li.driver_id = d.id
          LEFT JOIN schema1.institute_vehicles v ON v.id = CASE WHEN d.vehicle ~ '^[0-9]+$' THEN d.vehicle::integer ELSE NULL END
          WHERE d.org_id = $1::text
            AND ($2::text IS NULL OR d.status = $2)
            AND ($3::text IS NULL OR (
              d.first_name ILIKE '%' || $3 || '%' OR
              d.last_name ILIKE '%' || $3 || '%' OR
              d.mobile_number ILIKE '%' || $3 || '%' OR
              d.employee_id ILIKE '%' || $3 || '%' OR
              d.email ILIKE '%' || $3 || '%'
            ))
          ORDER BY d.created_at DESC
          LIMIT $4 OFFSET $5
        `, [String(token.org_id), status, search, perPage, offset]);

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
        const { fields, files } = await parseMultipart(req);
        
        let profilePhotoUrl = null;
        if (files.profile_photo) {
          profilePhotoUrl = await uploadToBlob(
            files.profile_photo.buffer, 
            files.profile_photo.filename, 
            files.profile_photo.mimetype, 
            'drivers'
          );
        }

        await client.query('BEGIN');

        try {
          const driverResult = await client.query(`
            INSERT INTO schema1.institute_drivers (
              org_id, first_name, last_name, gender, date_of_birth, email, mobile_number, 
              blood_group, marital_status, profile_photo, employment_type, 
              employee_id, address_line_1, city, district, state, pin_code, 
              vehicle, beacon_id, status, remarks
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 
              $17, $18, $19, $20, $21
            ) RETURNING *
          `, [
            String(token.org_id), fields.first_name, fields.last_name, fields.gender, 
            fields.dob || null, fields.email, fields.mobile_number, fields.blood_group, 
            fields.marital_status, profilePhotoUrl, fields.employment_type, 
            fields.employee_id, fields.address, fields.city, fields.district, 
            fields.state, fields.pin_code, fields.assigned_vehicle_id, 
            fields.beacon_id, fields.status || 'Active', fields.remarks
          ]);

          const driverId = driverResult.rows[0].id;

          await client.query(`
            INSERT INTO schema1.institute_driver_license_insurance (
              driver_id, number, issue_date, exp_date, type
            ) VALUES (
              $1, $2, $3, $4, $5
            )
          `, [
            driverId, fields.dl_number, fields.dl_issue_date || null, 
            fields.dl_expiry_date || null, fields.license_type
          ]);

          await client.query('COMMIT');

          // Return combined data to match GET structure mostly
          const fullResult = await client.query(`
            SELECT d.*,
              li.dl_number, li.dl_expiry_date, li.license_type
            FROM schema1.institute_drivers d
            LEFT JOIN schema1.institute_driver_license_insurance li ON li.driver_id = d.id
            WHERE d.id = $1
          `, [driverId]);

          return ok(fullResult.rows[0]);
        } catch (txnError) {
          await client.query('ROLLBACK');
          throw txnError;
        }
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      if (e.code === "23505") return err(409, "Driver or associated record already exists");
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
