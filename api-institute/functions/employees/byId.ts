import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";
import { uploadToBlob } from "../../shared/blob";

app.http("employeesById", {
  route: "employees/{id}",
  methods: ["GET", "PUT", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;
      const employeeId = req.params.id;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      if (req.method === "GET") {
        const result = await client.query(`
          SELECT e.*, r.name as role_name
          FROM schema1.institute_employees e
          LEFT JOIN schema1.institute_roles r ON r.id = e.role_id
          WHERE e.id = $1 AND e.org_id = $2
        `, [employeeId, token.org_id]);

        if (result.rows.length === 0) return err(404, "Employee not found");
        return ok(result.rows[0]);
      }

      if (req.method === "PUT") {
        const { fields, files } = await parseMultipart(req);
        
        let profilePhotoUrl = undefined;
        if (files.profilePhoto) {
          profilePhotoUrl = await uploadToBlob(
            files.profilePhoto.buffer, 
            files.profilePhoto.filename, 
            files.profilePhoto.mimetype, 
            'employees'
          );
        }

        const result = await client.query(`
          UPDATE schema1.institute_employees SET
            first_name = COALESCE($3, first_name),
            last_name = COALESCE($4, last_name),
            gender = COALESCE($5, gender),
            email = COALESCE($6, email),
            phone = COALESCE($7, phone),
            designation = COALESCE($8, designation),
            department = COALESCE($9, department),
            employment_type = COALESCE($10, employment_type),
            joining_date = COALESCE($11, joining_date),
            dob = COALESCE($12, dob),
            address = COALESCE($13, address),
            address2 = COALESCE($14, address2),
            landmark = COALESCE($15, landmark),
            state = COALESCE($16, state),
            district = COALESCE($17, district),
            city = COALESCE($18, city),
            pin_code = COALESCE($19, pin_code),
            emergency_name = COALESCE($20, emergency_name),
            emergency_phone = COALESCE($21, emergency_phone),
            emergency_email = COALESCE($22, emergency_email),
            bank_name = COALESCE($23, bank_name),
            account_holder = COALESCE($24, account_holder),
            account_number = COALESCE($25, account_number),
            ifsc = COALESCE($26, ifsc),
            profile_photo_url = COALESCE($27, profile_photo_url),
            role_id = COALESCE($28, role_id),
            status = COALESCE($29, status),
            remarks = COALESCE($30, remarks),
            updated_at = NOW()
          WHERE id = $1 AND org_id = $2
          RETURNING *
        `, [
          employeeId, token.org_id, fields.first_name, fields.last_name, fields.gender, 
          fields.email, fields.phone, fields.designation, fields.department, fields.employment_type, 
          fields.joining_date || null, fields.dob || null, fields.address, fields.address2, 
          fields.landmark, fields.state, fields.district, fields.city, fields.pin_code, 
          fields.emergency_name, fields.emergency_phone, fields.emergency_email, fields.bank_name, 
          fields.account_holder, fields.account_number, fields.ifsc, profilePhotoUrl, 
          fields.role_id ? parseInt(fields.role_id) : null, fields.status, fields.remarks
        ]);

        if (result.rows.length === 0) return err(404, "Employee not found");
        return ok(result.rows[0]);
      }

      if (req.method === "DELETE") {
        const result = await client.query(
          `DELETE FROM schema1.institute_employees WHERE id = $1 AND org_id = $2`,
          [employeeId, token.org_id]
        );

        if (result.rowCount === 0) return err(404, "Employee not found");
        return ok({ deleted: true });
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
