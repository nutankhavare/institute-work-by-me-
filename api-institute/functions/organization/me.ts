import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";
import { uploadToBlob } from "../../shared/blob";

app.http("organizationMe", {
  route: "organization/me",
  methods: ["GET", "PUT", "OPTIONS"],
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
        const result = await client.query(
          `SELECT * FROM schema1.institute_organizations WHERE org_id = $1`,
          [token.org_id]
        );
        if (result.rows.length === 0) return err(404, "Organization profile not configured");
        return ok(result.rows[0]);
      }

      if (req.method === "PUT") {
        const { fields, files } = await parseMultipart(req);
        
        let logo_url = null;
        let pan_doc_url = null;
        let gst_doc_url = null;
        let registration_doc_url = null;

        if (files.logo) {
          logo_url = await uploadToBlob(files.logo.buffer, files.logo.filename, files.logo.mimetype, 'organizations');
        }
        if (files.pan_doc) {
          pan_doc_url = await uploadToBlob(files.pan_doc.buffer, files.pan_doc.filename, files.pan_doc.mimetype, 'organizations');
        }
        if (files.gst_doc) {
          gst_doc_url = await uploadToBlob(files.gst_doc.buffer, files.gst_doc.filename, files.gst_doc.mimetype, 'organizations');
        }
        if (files.registration_doc) {
          registration_doc_url = await uploadToBlob(files.registration_doc.buffer, files.registration_doc.filename, files.registration_doc.mimetype, 'organizations');
        }

        const address = fields.address ? JSON.parse(fields.address) : {};
        const contact = fields.contact ? JSON.parse(fields.contact) : {};
        const institute = fields.institute ? JSON.parse(fields.institute) : {};
        
        const docsObj: any = {};
        if (pan_doc_url) docsObj.pan_doc = pan_doc_url;
        if (gst_doc_url) docsObj.gst_doc = gst_doc_url;
        if (registration_doc_url) docsObj.registration_doc = registration_doc_url;

        // Upsert pattern
        const result = await client.query(`
          INSERT INTO schema1.institute_organizations (
            org_id, name, type, registration_no, gst_number, pan_number, 
            status, subscription_plan, logo_url, address, contact, institute, documents
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb)
          ON CONFLICT (org_id) DO UPDATE SET
            name = COALESCE(EXCLUDED.name, schema1.institute_organizations.name),
            type = COALESCE(EXCLUDED.type, schema1.institute_organizations.type),
            registration_no = COALESCE(EXCLUDED.registration_no, schema1.institute_organizations.registration_no),
            gst_number = COALESCE(EXCLUDED.gst_number, schema1.institute_organizations.gst_number),
            pan_number = COALESCE(EXCLUDED.pan_number, schema1.institute_organizations.pan_number),
            status = COALESCE(EXCLUDED.status, schema1.institute_organizations.status),
            subscription_plan = COALESCE(EXCLUDED.subscription_plan, schema1.institute_organizations.subscription_plan),
            logo_url = COALESCE(EXCLUDED.logo_url, schema1.institute_organizations.logo_url),
            address = COALESCE(EXCLUDED.address, schema1.institute_organizations.address),
            contact = COALESCE(EXCLUDED.contact, schema1.institute_organizations.contact),
            institute = COALESCE(EXCLUDED.institute, schema1.institute_organizations.institute),
            documents = schema1.institute_organizations.documents || EXCLUDED.documents,
            updated_at = NOW()
          RETURNING *
        `, [
          token.org_id,
          fields.name,
          fields.type,
          fields.registration_no,
          fields.gst_number,
          fields.pan_number,
          fields.status || 'Active',
          fields.subscription_plan,
          logo_url,
          JSON.stringify(address),
          JSON.stringify(contact),
          JSON.stringify(institute),
          JSON.stringify(docsObj)
        ]);

        return ok(result.rows[0]);
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
