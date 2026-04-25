import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";
import { sendEmail } from "../../shared/messaging";

app.http("broadcastsIndex", {
  route: "broadcasts",
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

      // GET: List Broadcast History
      if (req.method === "GET") {
        const url = new URL(req.url);
        const page = parseInt(url.searchParams.get("page") || "1", 10);
        const perPage = parseInt(url.searchParams.get("per_page") || "15", 10);
        const offset = (page - 1) * perPage;

        const countResult = await client.query(`
          SELECT COUNT(*) FROM schema1.institute_broadcasts WHERE org_id = $1
        `, [token.org_id]);
        const total = parseInt(countResult.rows[0].count, 10);

        const result = await client.query(`
          SELECT * FROM schema1.institute_broadcasts 
          WHERE org_id = $1 
          ORDER BY created_at DESC 
          LIMIT $2 OFFSET $3
        `, [token.org_id, perPage, offset]);

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

      // POST: Send Broadcast
      if (req.method === "POST") {
        const body = (await req.json()) as any;
        const { target_audience, channel, subject, body: messageBody, scheduled_at } = body;

        if (!subject || !messageBody || !target_audience) {
          return err(400, "Missing required fields: subject, body, or target_audience");
        }

        // 0. Fetch Organization Name for Dynamic Sender
        const orgResult = await client.query(
          `SELECT name FROM schema1.institute_organizations WHERE org_id = $1`,
          [token.org_id]
        );
        const senderName = orgResult.rows[0]?.name || "Institute Admin";

        // 1. Resolve Recipients
        let recipients: any[] = [];
        const { recipient_ids } = body; // Optional array of { id, type }

        if (recipient_ids && Array.isArray(recipient_ids)) {
          for (const item of recipient_ids) {
            const table = item.type === 'staff' ? 'schema1.institute_employees' : 'schema1.institute_drivers';
            const phoneCol = item.type === 'staff' ? 'phone' : 'mobile_number as phone';
            
            const res = await client.query(`
              SELECT id, first_name, last_name, email, ${phoneCol} FROM ${table} 
              WHERE id = $1 AND org_id = $2 AND status = 'Active' AND email IS NOT NULL
            `, [item.id, token.org_id]);
            
            if (res.rows.length > 0) {
              recipients.push({ ...res.rows[0], type: item.type === 'staff' ? 'employee' : 'driver' });
            }
          }
        } else {
          if (target_audience === "staff" || target_audience === "everyone") {
            const staff = await client.query(`
              SELECT id, first_name, last_name, email, phone FROM schema1.institute_employees 
              WHERE org_id = $1 AND status = 'Active' AND email IS NOT NULL
            `, [token.org_id]);
            recipients.push(...staff.rows.map(r => ({ ...r, type: 'employee' })));
          }

          if (target_audience === "drivers" || target_audience === "everyone") {
            const drivers = await client.query(`
              SELECT id, first_name, last_name, email, mobile_number as phone FROM schema1.institute_drivers 
              WHERE org_id = $1 AND status = 'Active' AND email IS NOT NULL
            `, [token.org_id]);
            recipients.push(...drivers.rows.map(r => ({ ...r, type: 'driver' })));
          }
        }

        if (recipients.length === 0) {
          return err(400, "No active recipients found for the selected audience.");
        }

        // 2. Create Broadcast Record
        const status = scheduled_at ? "scheduled" : "sending";
        const broadcastResult = await client.query(`
          INSERT INTO schema1.institute_broadcasts (
            org_id, target_audience, channel, subject, body, status, scheduled_at, total_recipients
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [token.org_id, target_audience, channel, subject, messageBody, status, scheduled_at || null, recipients.length]);

        const broadcast = broadcastResult.rows[0];

        // 3. Process Sending (If not scheduled)
        if (!scheduled_at && channel === "email") {
          let deliveredCount = 0;
          
          for (const recipient of recipients) {
            const emailResult = await sendEmail(recipient.email, subject, messageBody, senderName);
            
            await client.query(`
              INSERT INTO schema1.institute_broadcast_recipients (
                broadcast_id, recipient_type, recipient_id, recipient_name, recipient_email, recipient_phone, status, error_message, sent_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            `, [
              broadcast.id, 
              recipient.type, 
              recipient.id, 
              `${recipient.first_name} ${recipient.last_name}`, 
              recipient.email, 
              recipient.phone, 
              emailResult.success ? 'delivered' : 'failed', 
              emailResult.error || null
            ]);

            if (emailResult.success) deliveredCount++;
          }

          // Update final status
          await client.query(`
            UPDATE schema1.institute_broadcasts 
            SET status = 'sent', delivered_count = $1, sent_at = NOW() 
            WHERE id = $2
          `, [deliveredCount, broadcast.id]);
          
          broadcast.status = "sent";
          broadcast.delivered_count = deliveredCount;
        }

        return ok(broadcast);
      }

      return err(405, "Method not allowed");
    } catch (e: any) {
      ctx.error(e);
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
