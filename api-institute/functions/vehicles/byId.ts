import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";
import { uploadToBlob } from "../../shared/blob";

app.http("vehiclesById", {
  route: "vehicles/{id}",
  methods: ["GET", "PUT", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;
      const vehicleId = req.params.id;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      if (req.method === "GET") {
        const result = await client.query(`
          SELECT * FROM schema1.institute_vehicles
          WHERE id = $1 AND org_id = $2
        `, [vehicleId, token.org_id]);

        if (result.rows.length === 0) return err(404, "Vehicle not found");
        return ok(result.rows[0]);
      }

      if (req.method === "PUT") {
        const { fields, files } = await parseMultipart(req);
        
        const docUploads: Record<string, string | undefined> = {
          rc_book_doc: undefined,
          insurance_doc: undefined,
          fitness_doc: undefined,
          pollution_doc: undefined
        };

        for (const [key, file] of Object.entries(files)) {
          if (key in docUploads) {
            docUploads[key] = await uploadToBlob(file.buffer, file.filename, file.mimetype, 'vehicles');
          }
        }

        const result = await client.query(`
          UPDATE schema1.institute_vehicles SET
            vehicle_number = COALESCE($3, vehicle_number),
            model = COALESCE($4, model),
            manufacturer = COALESCE($5, manufacturer),
            vehicle_type = COALESCE($6, vehicle_type),
            year = COALESCE($7, year),
            fuel_type = COALESCE($8, fuel_type),
            seating_capacity = COALESCE($9, seating_capacity),
            colour = COALESCE($10, colour),
            status = COALESCE($11, status),
            gps_device_id = COALESCE($12, gps_device_id),
            sim_number = COALESCE($13, sim_number),
            gps_install_date = COALESCE($14, gps_install_date),
            assigned_driver = COALESCE($15, assigned_driver),
            ownership_type = COALESCE($16, ownership_type),
            owner_name = COALESCE($17, owner_name),
            owner_contact = COALESCE($18, owner_contact),
            insurance_provider = COALESCE($19, insurance_provider),
            insurance_policy_no = COALESCE($20, insurance_policy_no),
            insurance_expiry = COALESCE($21, insurance_expiry),
            permit_type = COALESCE($22, permit_type),
            permit_number = COALESCE($23, permit_number),
            permit_issue = COALESCE($24, permit_issue),
            permit_expiry = COALESCE($25, permit_expiry),
            fitness_cert_no = COALESCE($26, fitness_cert_no),
            fitness_expiry = COALESCE($27, fitness_expiry),
            pollution_cert_no = COALESCE($28, pollution_cert_no),
            pollution_expiry = COALESCE($29, pollution_expiry),
            last_service = COALESCE($30, last_service),
            next_service = COALESCE($31, next_service),
            km_driven = COALESCE($32, km_driven),
            fire_extinguisher = COALESCE($33, fire_extinguisher),
            first_aid_kit = COALESCE($34, first_aid_kit),
            cctv = COALESCE($35, cctv),
            panic_button = COALESCE($36, panic_button),
            rc_book_doc = COALESCE($37, rc_book_doc),
            insurance_doc = COALESCE($38, insurance_doc),
            fitness_doc = COALESCE($39, fitness_doc),
            pollution_doc = COALESCE($40, pollution_doc),
            updated_at = NOW()
          WHERE id = $1 AND org_id = $2
          RETURNING *
        `, [
          vehicleId, token.org_id, 
          fields.vehicle_number, fields.model, fields.manufacturer, 
          fields.vehicle_type, fields.year ? parseInt(fields.year) : null, fields.fuel_type, 
          fields.seating_capacity ? parseInt(fields.seating_capacity) : null, fields.colour, 
          fields.status, fields.gps_device_id, fields.sim_number, fields.gps_install_date || null, 
          fields.assigned_driver, fields.ownership_type, fields.owner_name, fields.owner_contact, 
          fields.insurance_provider, fields.insurance_policy_no, fields.insurance_expiry || null, 
          fields.permit_type, fields.permit_number, fields.permit_issue || null, fields.permit_expiry || null, 
          fields.fitness_cert_no, fields.fitness_expiry || null, fields.pollution_cert_no, 
          fields.pollution_expiry || null, fields.last_service || null, fields.next_service || null, 
          fields.km_driven ? parseInt(fields.km_driven) : null, 
          fields.fire_extinguisher !== undefined ? fields.fire_extinguisher === 'true' : null, 
          fields.first_aid_kit !== undefined ? fields.first_aid_kit === 'true' : null, 
          fields.cctv !== undefined ? fields.cctv === 'true' : null, 
          fields.panic_button !== undefined ? fields.panic_button === 'true' : null, 
          docUploads.rc_book_doc, docUploads.insurance_doc, docUploads.fitness_doc, docUploads.pollution_doc
        ]);

        if (result.rows.length === 0) return err(404, "Vehicle not found");
        return ok(result.rows[0]);
      }

      if (req.method === "DELETE") {
        const result = await client.query(
          `DELETE FROM schema1.institute_vehicles WHERE id = $1 AND org_id = $2`,
          [vehicleId, token.org_id]
        );

        if (result.rowCount === 0) return err(404, "Vehicle not found");
        return ok({ deleted: true });
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      if (e.code === "23505") return err(409, "Vehicle already exists");
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
