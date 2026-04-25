import jwt from "jsonwebtoken";
import type { HttpRequest } from "@azure/functions";

export interface MdsToken {
  sub: string;
  email: string;
  org_id: number;
  role_name: string;
  permissions: string[];
  access_level: string;
  is_owner: boolean;
}

export function signToken(payload: MdsToken): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    algorithm: "HS256",
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN ?? "86400"),
  });
}

export function requireAuth(
  req: HttpRequest,
): { user: MdsToken } | { error: string } {
  try {
    const header = req.headers.get("Authorization") ?? "";
    if (!header.startsWith("Bearer ")) return { error: "Missing token" };

    const token = header.replace("Bearer ", "");
    const user = jwt.verify(token, process.env.JWT_SECRET!, {
      algorithms: ["HS256"],
    }) as MdsToken;

    return { user };
  } catch (e: unknown) {
    return {
      error:
        e instanceof Error && e.message === "jwt expired"
          ? "Session expired"
          : "Invalid token",
    };
  }
}
