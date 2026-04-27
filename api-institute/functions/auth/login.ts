import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import bcrypt from "bcryptjs";
import { getPool } from "../../shared/db";
import { ok, err, preflight } from "../../shared/response";
import { signToken } from "../../shared/auth";

app.http("authLogin", {
  methods: ["POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "auth/login",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();

    const body = (await req.json().catch(() => null)) as { email?: string; password?: string } | null;
    if (!body?.email || !body?.password) {
      return err(400, "Email and password required");
    }

    const client = await getPool().connect();
    try {
      const { rows } = await client.query(
        `SELECT id, org_id, role, email, password
         FROM public.users
         WHERE LOWER(email) = LOWER($1)
         LIMIT 1`,
        [body.email.trim()]
      );

      const userRecord = rows[0];
      if (!userRecord) return err(401, "Invalid credentials");

      const valid = await bcrypt.compare(body.password, userRecord.password);
      if (!valid) return err(401, "Invalid credentials");

      const token = signToken({
        sub: String(userRecord.id),
        email: userRecord.email,
        org_id: userRecord.org_id,
        role_name: userRecord.role,
        permissions: ["*"],
        access_level: "Root Access",
        is_owner: true
      });

      return ok({
        token,
        user: {
          id: userRecord.id,
          email: userRecord.email,
          name: userRecord.email,
          orgId: userRecord.org_id,
          roleName: userRecord.role,
          permissions: ["*"],
          accessLevel: "Root Access",
          isOwner: true
        }
      });
    } catch (e: any) {
      ctx.error("authLogin:", e);
      return err(500, "Server error");
    } finally {
      client.release();
    }
  }
});
