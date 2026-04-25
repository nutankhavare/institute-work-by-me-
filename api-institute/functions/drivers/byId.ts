import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";
import { uploadToBlob } from "../../shared/blob";

app.http("driversById", {
  route: "drivers/{id}",
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;
      const driverId = req.params.id;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      if (req.method === "GET") {
        const result = await client.query(`
          SELECT d.*,
            li.dl_number, li.dl_issue_date, li.dl_expiry_date, li.license_type,
            li.driving_experience, li.insurance_policy_no, li.insurance_expiry,
            v.vehicle_number as assigned_vehicle_number, v.model as assigned_vehicle_model
          FROM schema1.institute_drivers d
          LEFT JOIN schema1.institute_driver_license_insurance li ON li.driver_id = d.id
          LEFT JOIN schema1.institute_vehicles v ON v.id = d.assigned_vehicle_id
          WHERE d.id = $1 AND d.org_id = $2
        `, [driverId, token.org_id]);

        if (result.rows.length === 0) return err(404, "Driver not found");
        return ok(result.rows[0]);
      }

      if (req.method === "POST") {
        const { fields, files } = await parseMultipart(req);
        
        let profilePhotoUrl = undefined;
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
            UPDATE schema1.institute_drivers SET
              first_name = COALESCE($3, first_name),
              last_name = COALESCE($4, last_name),
              gender = COALESCE($5, gender),
              dob = COALESCE($6, dob),
              email = COALESCE($7, email),
              mobile_number = COALESCE($8, mobile_number),
              blood_group = COALESCE($9, blood_group),
              marital_status = COALESCE($10, marital_status),
              profile_photo_url = COALESCE($11, profile_photo_url),
              employment_type = COALESCE($12, employment_type),
              employee_id = COALESCE($13, employee_id),
              address = COALESCE($14, address),
              city = COALESCE($15, city),
              district = COALESCE($16, district),
              state = COALESCE($17, state),
              pin_code = COALESCE($18, pin_code),
              assigned_vehicle_id = COALESCE($19, assigned_vehicle_id),
              beacon_id = COALESCE($20, beacon_id),
              operational_base = COALESCE($21, operational_base),
              status = COALESCE($22, status),
              remarks = COALESCE($23, remarks),
              updated_at = NOW()
            WHERE id = $1 AND org_id = $2
            RETURNING *
          `, [
            driverId, token.org_id, 
            fields.first_name, fields.last_name, fields.gender, 
            fields.dob || null, fields.email, fields.mobile_number, fields.blood_group, 
            fields.marital_status, profilePhotoUrl, fields.employment_type, 
            fields.employee_id, fields.address, fields.city, fields.district, 
            fields.state, fields.pin_code, 
            fields.assigned_vehicle_id ? parseInt(fields.assigned_vehicle_id) : null, 
            fields.beacon_id, fields.operational_base, fields.status, fields.remarks
          ]);

          if (driverResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return err(404, "Driver not found");
          }

          // Check if license record exists
          const licenseCheck = await client.query(
            `SELECT id FROM schema1.institute_driver_license_insurance WHERE driver_id = $1`,
            [driverId]
          );

          if (licenseCheck.rows.length > 0) {
            await client.query(`
              UPDATE schema1.institute_driver_license_insurance SET
                dl_number = COALESCE($2, dl_number),
                dl_issue_date = COALESCE($3, dl_issue_date),
                dl_expiry_date = COALESCE($4, dl_expiry_date),
                license_type = COALESCE($5, license_type),
                driving_experience = COALESCE($6, driving_experience),
                insurance_policy_no = COALESCE($7, insurance_policy_no),
                insurance_expiry = COALESCE($8, insurance_expiry),
                updated_at = NOW()
              WHERE driver_id = $1
            `, [
              driverId, fields.dl_number, fields.dl_issue_date || null, 
              fields.dl_expiry_date || null, fields.license_type, 
              fields.driving_experience ? parseInt(fields.driving_experience) : null, 
              fields.insurance_policy_no, fields.insurance_expiry || null
            ]);
          } else {
            await client.query(`
              INSERT INTO schema1.institute_driver_license_insurance (
                driver_id, dl_number, dl_issue_date, dl_expiry_date, license_type, 
                driving_experience, insurance_policy_no, insurance_expiry
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8
              )
            `, [
              driverId, fields.dl_number, fields.dl_issue_date || null, 
              fields.dl_expiry_date || null, fields.license_type, 
              fields.driving_experience ? parseInt(fields.driving_experience) : null, 
              fields.insurance_policy_no, fields.insurance_expiry || null
            ]);
          }

          await client.query('COMMIT');

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

      if (req.method === "DELETE") {
        await client.query('BEGIN');
        try {
          // Delete license explicitly in case CASCADE is not set up correctly
          await client.query(
            `DELETE FROM schema1.institute_driver_license_insurance WHERE driver_id = $1`,
            [driverId]
          );
          
          const result = await client.query(
            `DELETE FROM schema1.institute_drivers WHERE id = $1 AND org_id = $2`,
            [driverId, token.org_id]
          );

          if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return err(404, "Driver not found");
          }
          
          await client.query('COMMIT');
          return ok({ deleted: true });
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
