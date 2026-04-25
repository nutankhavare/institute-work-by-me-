# MDS Setup Comparison Report

This report compares the current implementation of the MDS application with the standards and architecture described in the **MDS Azure Backend & Infrastructure Guide**.

## 1. Backend Architecture

| Component | Guide Standard | Current Implementation | Gap / Difference |
|-----------|----------------|-------------------------|------------------|
| **Core Framework** | Azure Functions v4 (Node.js) | Hybrid: Express Server + Azure Functions | The project runs primarily as an Express server via Bun (`src/server.ts`). Azure functions exist in `src/functions` but are not the primary entry point. |
| **Route Registry** | Centralized in `api/functions/index.ts` | Scattered: `app.http` called in each function file | Missing a central registration file to keep the app structured like a traditional backend. |
| **Entry Point** | Azure Function Worker | `bun src/server.ts` | The `package.json` points to `src/server.ts` instead of an Azure-compatible entry point. |

## 2. Azure Blob Storage Implementation

| Feature | Guide Standard | Current Implementation | Gap / Difference |
|---------|----------------|-------------------------|------------------|
| **Upload Method** | Base64 string via `/api/upload` | Multipart/form-data via `multer` | The guide expects a base64 bridge; the current setup uses traditional file uploads. |
| **Tenant Isolation** | Path: `[org_id]/[timestamp]-[filename]` | Path: `[timestamp]-[filename]` | **Security Risk:** Files are not isolated by organization in the storage container. |
| **Buffer Conversion** | Decodes base64 in the function | Handled by `multer.memoryStorage()` | Different approach, but achieves similar raw binary results. |

## 3. Database & Security

| Feature | Guide Standard | Current Implementation | Gap / Difference |
|---------|----------------|-------------------------|------------------|
| **RLS Mechanism** | `SET app.current_tenant = X` | `SET app.current_org_id = X` | Naming difference (`current_tenant` vs `current_org_id`). |
| **RLS Usage** | Via `withTenant(client, org_id)` | `withRLS` exists but is rarely used | Most queries in `server.ts` manually append `WHERE org_id = $1` instead of relying on PostgreSQL RLS session variables. |
| **Auth Middleware** | `requireAuth(req)` helper | Express `authMiddleware.ts` | The Azure Functions in `src/functions` lack a unified `requireAuth` wrapper as described. |
| **Response Format** | `ok()`, `err()`, `preflight()` helpers | Manual `res.json()` or `jsonBody` | Missing standardization helpers for JSON shape and CORS headers. |

## 4. Frontend Integration

| Feature | Guide Standard | Current Implementation | Gap / Difference |
|---------|----------------|-------------------------|------------------|
| **Vite Proxy** | Intercepts `/api` in `vite.config.ts` | No proxy configured | Frontend communicates directly with `localhost:4000` or `localhost:7071`. |
| **API Base URL** | `VITE_API_BASE_URL=/api` | `VITE_API_BASE_URL=http://localhost:4000/api` | Hardcoded host in `.env` instead of relative path with proxy. |
| **API Wrapper** | Unified `fetch()` wrapper | `axios` instance in `ApiService.ts` | Different library (axios vs fetch) but similar purpose. |

## 5. Missing Specialized APIs

The following endpoints described in the guide are either missing or implemented differently:

- **`POST /api/upload`**: The specific base64-to-blob bridge is not present as a standalone function.
- **`POST /api/auth/refresh`**: Current implementation exists but uses `GET` instead of `POST` as suggested by the guide.
- **`GET /api/dashboard/stats`**: A basic version exists in `src/functions/stats.ts` but may not be as comprehensive as the guide suggests.
- **`GET /api/vehicles/live`**: Current implementation is in `server.ts` as `/api/vehicles/live/location/:tenantId`.

## Recommended Actions to Align with Guide:

1.  **Refactor Architecture**: Move all logic from the monolithic `server.ts` into individual Azure Functions under `src/functions`.
2.  **Centralize Registration**: Create `src/functions/index.ts` to register all `app.http` routes in one place.
3.  **Enhance Blob Storage**: Update `src/lib/azureStorage.ts` to include the `org_id` in the blob path for tenant isolation.
4.  **Standardize Responses**: Create a `src/shared/response.ts` with `ok()` and `err()` helpers to ensure consistent JSON structure.
5.  **Implement RLS properly**: Use the `withRLS` (or rename to `withTenant`) helper consistently across all data-fetching functions.
6.  **Configure Vite Proxy**: Update `frontend/vite.config.ts` and `frontend/.env` to use the proxy strategy for seamless local development.
