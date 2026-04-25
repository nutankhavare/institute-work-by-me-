import { app, HttpRequest, InvocationContext } from "@azure/functions";
import type { HttpResponseInit } from "@azure/functions";
import { withRLS } from "../lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dummy-secret-for-now";

function getOrgId(request: HttpRequest): string | null {
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return null;
    try {
        const token = authHeader.split(" ")[1];
        if (!token) return null;
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        return decoded.org_id;
    } catch {
        return null;
    }
}

/**
 * GET Stats Summary (Isolated by RLS)
 */
export async function getStatsSummary(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const orgId = getOrgId(request);
    if (!orgId) return { status: 401, jsonBody: { message: "Unauthorized" } };

    try {
        const stats = await withRLS(orgId, async (client) => {
            const countRes = await client.query('SELECT COUNT(*) FROM vehicles');
            const activeRes = await client.query("SELECT COUNT(*) FROM vehicles WHERE status = 'active'");
            
            return {
                totalVehicles: parseInt(countRes.rows[0].count),
                activeVehicles: parseInt(activeRes.rows[0].count),
                totalStaff: 0,
                activeTrips: 0
            };
        });

        return {
            status: 200,
            jsonBody: { success: true, data: stats }
        };
    } catch (err: any) {
        context.error(`Error fetching stats: ${err.message}`);
        return { status: 500, jsonBody: { message: "Error fetching data" } };
    }
}

app.http('getStatsSummary', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'stats/summary',
    handler: getStatsSummary
});
