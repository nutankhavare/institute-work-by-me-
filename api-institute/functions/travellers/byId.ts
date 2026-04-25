import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { parseMultipart } from "../../shared/multipart";

// Important: travellersUpdate must be registered before travellersById to prevent route shadowing
app.http("travellersUpdate", {
  route: "travellers/update/{id}",
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;
      const travellerId = req.params.id;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      const contentType = req.headers.get("content-type") || "";
      let body: any;

      if (contentType.includes("multipart/form-data")) {
        const { fields } = await parseMultipart(req);
        body = fields;
      } else {
        body = await req.json();
      }

      const result = await client.query(`
        UPDATE schema1.institute_travellers SET
          first_name = COALESCE($3, first_name),
          last_name = COALESCE($4, last_name),
          email = COALESCE($5, email),
          phone = COALESCE($6, phone),
          route = COALESCE($7, route),
          boarding_point = COALESCE($8, boarding_point),
          beacon_id = COALESCE($9, beacon_id),
          status = COALESCE($10, status),
          updated_at = NOW()
        WHERE id = $1 AND org_id = $2
        RETURNING *
      `, [
        travellerId, token.org_id, 
        body.first_name, body.last_name, body.email, body.phone, 
        body.route, body.boarding_point, body.beacon_id, body.status
      ]);

      if (result.rows.length === 0) return err(404, "Traveller not found");
      return ok(result.rows[0]);
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});

app.http("travellersById", {
  route: "travellers/{id}",
  methods: ["GET", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const auth = requireAuth(req);
      if ("error" in auth) return err(401, auth.error);
      const token = auth.user;
      const travellerId = req.params.id;

      client = await getPool().connect();
      await withTenant(client, token.org_id);

      if (req.method === "GET") {
        const result = await client.query(`
          SELECT * FROM schema1.institute_travellers
          WHERE id = $1 AND org_id = $2
        `, [travellerId, token.org_id]);

        if (result.rows.length === 0) return err(404, "Traveller not found");
        return ok(result.rows[0]);
      }

      if (req.method === "DELETE") {
        const result = await client.query(
          `DELETE FROM schema1.institute_travellers WHERE id = $1 AND org_id = $2`,
          [travellerId, token.org_id]
        );

        if (result.rowCount === 0) return err(404, "Traveller not found");
        return ok({ deleted: true });
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
