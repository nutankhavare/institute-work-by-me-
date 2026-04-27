import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { requireAuth, signToken, MdsToken } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

app.http("authRefresh", {
  methods: ["GET", "POST", "OPTIONS"],
  authLevel: "anonymous",
  route: "auth/refresh",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();

    const auth = requireAuth(req);
    if ("error" in auth) return err(401, auth.error);

    // Strip JWT internal fields (iat, exp, nbf) before re-signing
    const { iat, exp, nbf, ...payload } = auth.user as MdsToken & { iat?: number; exp?: number; nbf?: number };
    const token = signToken(payload as MdsToken);

    // Return token + user data so frontend can hydrate auth state
    return ok({
      token,
      user: {
        id: parseInt(payload.sub) || 0,
        email: payload.email,
        name: payload.email,
        orgId: payload.org_id,
        roleName: payload.role_name,
        permissions: payload.permissions || ["*"],
        accessLevel: payload.access_level,
        isOwner: payload.is_owner
      }
    });
  }
});
