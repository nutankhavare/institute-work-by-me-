import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";
import { uploadToBlob } from "../../shared/blob";

app.http("complianceIndex", {
  route: "compliance",
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
        const category = url.searchParams.get("category") || null; // maps to entity_type
        const offset = (page - 1) * perPage;

        const countResult = await client.query(`
          SELECT COUNT(*) FROM schema1.institute_compliance c
          WHERE c.org_id = $1::text
            AND ($2::text IS NULL OR c.status = $2)
            AND ($3::text IS NULL OR c.category = $3)
            AND ($4::text IS NULL OR c.document_name ILIKE '%' || $4 || '%')
        `, [String(token.org_id), status, category, search]);
        const total = parseInt(countResult.rows[0].count, 10);

        const result = await client.query(`
          SELECT c.*,
            c.document_name as document_type,
            c.registration_number as document_number
          FROM schema1.institute_compliance c
          WHERE c.org_id = $1::text
            AND ($2::text IS NULL OR c.status = $2)
            AND ($3::text IS NULL OR c.category = $3)
            AND ($4::text IS NULL OR c.document_name ILIKE '%' || $4 || '%')
          ORDER BY c.created_at DESC
          LIMIT $5 OFFSET $6
        `, [String(token.org_id), status, category, search, perPage, offset]);

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
        
        let documentUrl = null;
        if (files.document_file) {
          documentUrl = await uploadToBlob(
            files.document_file.buffer, 
            files.document_file.filename, 
            files.document_file.mimetype, 
            'compliance'
          );
        }

        const result = await client.query(`
          INSERT INTO schema1.institute_compliance (
            org_id, document_name, registration_number, category, 
            status, document_url, remarks, applies_to
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8::jsonb
          ) RETURNING *
        `, [
          String(token.org_id), 
          fields.document_type, 
          fields.document_number, 
          fields.entity_type, 
          fields.status || 'Valid', 
          documentUrl, 
          fields.remarks,
          JSON.stringify({ type: fields.entity_type, id: fields.entity_id })
        ]);

        return ok(result.rows[0]);
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      if (e.code === "23503") return err(404, "Related entity not found");
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
