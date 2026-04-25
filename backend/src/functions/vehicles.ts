import { app, HttpRequest, InvocationContext } from "@azure/functions";
import type { HttpResponseInit } from "@azure/functions";
import { withRLS } from "../lib/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dummy-secret-for-now";

/**
 * Get Org ID from JWT
 */
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
 * GET Vehicles (Isolated by RLS)
 */
export async function getVehicles(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const orgId = getOrgId(request);
    if (!orgId) return { status: 401, jsonBody: { message: "Unauthorized" } };

    try {
        const vehicles = await withRLS(orgId, async (client) => {
            const result = await client.query('SELECT * FROM vehicles');
            return result.rows;
        });

        return {
            status: 200,
            jsonBody: { success: true, data: vehicles }
        };
    } catch (err: any) {
        context.error(`Error fetching vehicles: ${err.message}`);
        return { status: 500, jsonBody: { message: "Error fetching data" } };
    }
}

/**
 * POST Vehicle
 */
export async function createVehicle(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const orgId = getOrgId(request);
    if (!orgId) return { status: 401, jsonBody: { message: "Unauthorized" } };

    const body = (await request.json()) as any;

    try {
        const newVehicle = await withRLS(orgId, async (client) => {
            // RLS doesn't auto-populate org_id on insert, so we must include it
            const query = `
                INSERT INTO vehicles (
                    org_id, vehicle_number, vehicle_type, rc_number, status, manufacturer, vehicle_model
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            const values = [
                orgId, body.vehicle_number, body.vehicle_type, body.rc_number, 
                body.status || 'active', body.manufacturer, body.vehicle_model
            ];
            const result = await client.query(query, values);
            return result.rows[0];
        });

        return {
            status: 201,
            jsonBody: { success: true, data: newVehicle }
        };
    } catch (err: any) {
        context.error(`Error creating vehicle: ${err.message}`);
        return { status: 500, jsonBody: { message: "Error saving data" } };
    }
}

app.http('getVehicles', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'vehicles',
    handler: getVehicles
});

app.http('createVehicle', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'vehicles',
    handler: createVehicle
});
