import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";
import { uploadToBlob } from "../../shared/blob";

app.http("employeesIndex", {
  route: "employees",
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
          SELECT COUNT(*) FROM schema1.institute_employees
          WHERE org_id = $1
            AND ($2::text IS NULL OR status = $2)
            AND ($3::text IS NULL OR (
              first_name ILIKE '%' || $3 || '%' OR
              last_name ILIKE '%' || $3 || '%' OR
              email ILIKE '%' || $3 || '%' OR
              phone ILIKE '%' || $3 || '%' OR
              employee_id ILIKE '%' || $3 || '%'
            ))
        `, [token.org_id, status, search]);
        const total = parseInt(countResult.rows[0].count, 10);

        const result = await client.query(`
          SELECT e.*, r.name as role_name
          FROM schema1.institute_employees e
          LEFT JOIN schema1.institute_roles r ON r.id = e.role_id
          WHERE e.org_id = $1
            AND ($2::text IS NULL OR e.status = $2)
            AND ($3::text IS NULL OR (
              e.first_name ILIKE '%' || $3 || '%' OR
              e.last_name ILIKE '%' || $3 || '%' OR
              e.email ILIKE '%' || $3 || '%' OR
              e.phone ILIKE '%' || $3 || '%' OR
              e.employee_id ILIKE '%' || $3 || '%'
            ))
          ORDER BY e.created_at DESC
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
        const { fields, files } = await parseMultipart(req);
        
        let profilePhotoUrl = null;
        if (files.profilePhoto) {
          profilePhotoUrl = await uploadToBlob(
            files.profilePhoto.buffer, 
            files.profilePhoto.filename, 
            files.profilePhoto.mimetype, 
            'employees'
          );
        }

        const result = await client.query(`
          INSERT INTO schema1.institute_employees (
            org_id, first_name, last_name, gender, email, phone, designation, 
            department, employment_type, joining_date, dob, address, address2, 
            landmark, state, district, city, pin_code, emergency_name, emergency_phone, 
            emergency_email, bank_name, account_holder, account_number, ifsc, 
            profile_photo_url, role_id, status, remarks
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 
            $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
          ) RETURNING *
        `, [
          token.org_id, fields.first_name, fields.last_name, fields.gender, fields.email, 
          fields.phone, fields.designation, fields.department, fields.employment_type, 
          fields.joining_date || null, fields.dob || null, fields.address, fields.address2, 
          fields.landmark, fields.state, fields.district, fields.city, fields.pin_code, 
          fields.emergency_name, fields.emergency_phone, fields.emergency_email, fields.bank_name, 
          fields.account_holder, fields.account_number, fields.ifsc, profilePhotoUrl, 
          fields.role_id ? parseInt(fields.role_id) : null, fields.status || 'Active', fields.remarks
        ]);

        return ok(result.rows[0]);
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      if (e.code === "23505") return err(409, "Record already exists");
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
