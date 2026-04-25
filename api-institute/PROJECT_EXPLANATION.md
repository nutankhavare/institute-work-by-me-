# Institute Admin Panel: Azure Functions Backend Architecture

This document provides a detailed, folder-by-folder and step-by-step explanation of the new Azure Functions backend we built for the VanLoka Institute Admin Panel.

---

## 1. Project Root (`/api-institute`)

**What we created here:**
- `package.json` & `tsconfig.json`: Standard Node.js and TypeScript configuration files.
- `host.json`: Azure Functions runtime configuration.
- `local.settings.json`: Local development environment variables.

**Why we created it:**
To establish a standalone, deployable Azure Functions v4 project. We needed specific dependencies like `@azure/functions` for the compute layer, `pg` for the PostgreSQL connection, `busboy` for parsing multipart forms (since the legacy Laravel frontend sends forms, not JSON), and `@azure/storage-blob` to replace local file uploads with cloud storage.

---

## 2. Shared Utilities (`/shared`)

This folder contains the core logic that every single API route relies on. 

### `db.ts`
- **What it does:** Manages a single, reusable connection pool (`pg`) to the Azure PostgreSQL Flexible Server database. It also provides the `withTenant(client, org_id)` function.
- **Why we created it:** Reusing a database connection pool is critical in serverless architectures to prevent exhausting the database's maximum connections during spikes in traffic. The `withTenant` function enforces Row-Level Security (RLS) by setting the local PostgreSQL variable `app.current_org_id`, ensuring that queries cannot accidentally fetch data belonging to another institute.

### `auth.ts`
- **What it does:** Provides the `requireAuth(req)` function to parse the `Authorization: Bearer <token>` header, verify the JWT, and extract the user's `org_id` and permissions.
- **Why we created it:** Every protected route needs to know exactly *who* is calling it and *which* organization they belong to. This acts as the gatekeeper for the entire API.

### `response.ts`
- **What it does:** Provides utility functions `ok()`, `err()`, and `preflight()`.
- **Why we created it:** The React frontend expects every API response to look exactly the same (e.g., `{ success: true, data: ..., error: null }`). These helpers enforce that strict contract so the frontend never crashes due to an unexpected JSON structure. `preflight()` automatically handles CORS for browser requests.

### `multipart.ts`
- **What it does:** Exposes `parseMultipart(req)`, a wrapper around `busboy` that parses `multipart/form-data` streams into text fields and binary file buffers.
- **Why we created it:** The React frontend was cloned from legacy Laravel Blade views. Those legacy views used standard HTML forms with `<input type="file">`. Consequently, the React code still uses `FormData` and sends `multipart/form-data` instead of standard JSON. We had to build this so the Node.js backend could understand the legacy frontend's requests.

### `blob.ts`
- **What it does:** Exposes `uploadToBlob()`, taking a file buffer and streaming it directly to an Azure Storage Container, returning a public URL.
- **Why we created it:** In the old monolith, files were saved directly to the server's hard drive (`storage/app/public`). In a serverless environment like Azure Functions, the local hard drive is ephemeral (temporary). If you save a file there, it disappears. We must stream all profile photos, insurance docs, and RC books to Azure Blob Storage to persist them permanently.

---

## 3. Function Routes (`/functions`)

This is where the actual business logic lives. We organized this folder strictly by domain entity to keep the codebase modular.

### `index.ts`
- **What it does:** The single entry point that imports all other function files.
- **Why we created it:** Azure Functions v4 uses a programmatic model. Instead of relying on rigid folder structures and `function.json` files like older versions, we programmatically register routes in code (`app.http(...)`). Importing them all here tells the Azure runtime which URLs to listen to. **Route order matters here** to prevent generalized routes (like `{id}`) from accidentally intercepting specific routes (like `trackSingle`).

### `dashboard/`
- **`stats.ts`:** Returns aggregate counts. We added SQL `COUNT(*)` queries targeting `schema1.institute_employees` and `schema1.institute_drivers`. This powers the summary cards on the admin dashboard.

### `organization/`
- **`me.ts`:** Handles GET and PUT for the current user's organization profile.
- **Why it's special:** It implements a complex SQL `UPSERT` pattern (`ON CONFLICT (org_id) DO UPDATE`). When an admin first fills out their profile, it inserts a new row. When they edit it later, it updates the existing row seamlessly. It also orchestrates uploading up to 4 different PDFs/images (Logo, PAN, GST, Registration) simultaneously.

### `employees/`
- **`index.ts` & `byId.ts`:** The CRUD operations for staff members.
- **Why it's special:** The frontend expects a "Laravel-style Pagination Envelope". Instead of just returning an array of users `[user1, user2]`, we manually calculate offsets, limits, and pages to return exactly `{ data: [...], current_page: 1, last_page: 5, total: 50, per_page: 15 }`. This prevents having to rewrite the React frontend's pagination components.

### `vehicles/`
- **`index.ts` & `byId.ts`:** Full CRUD for vehicles, heavily reliant on `multipart.ts` because a single vehicle creation can upload RC Books, Fitness Certificates, Pollution Certificates, and Insurance Documents all at once.
- **`live.ts` & `trackSingle.ts`:** Real-time GPS/Beacon tracking routes. We secured these by extracting the `{tenantId}` from the URL and throwing a `403 Forbidden` error if the JWT token's `org_id` doesn't match the URL, preventing unauthorized tracking.

### `drivers/`
- **`index.ts` & `byId.ts`:** Manages drivers and their associated licenses.
- **Why it's special:** A driver consists of *two* database tables: `institute_drivers` (personal info) and `institute_driver_license_insurance` (license info). We implemented strict **SQL Transactions** (`BEGIN`, `COMMIT`, `ROLLBACK`). If creating the driver succeeds but saving their license fails, the database automatically rolls back the entire operation to prevent orphaned, corrupted data.
- **`dropdowns.ts`:** Exposes highly optimized, lightweight queries that only select `id` and `name` to populate React `<select>` dropdowns across the application without fetching heavy tables.

### `travellers/`
- **`index.ts` & `byId.ts`:** Manages the students/employees being transported.
- **Why it's special:** Legacy Laravel resource controllers had a specific quirk where updates happened via `POST /travellers/update/{id}` instead of a RESTful `PUT /travellers/{id}`. We explicitly coded our Azure Function to listen on that exact quirky route so the frontend didn't need to be updated.

### `bookings/`
- **`index.ts` & `byId.ts`:** Manages the assignment of travellers to vehicles. Uses comprehensive SQL `LEFT JOIN`s to merge traveller names, phone numbers, and vehicle models directly into the response payload so the frontend table displays human-readable data instead of raw IDs.

### `compliance/`
- **`index.ts` & `byId.ts`:** A unified document tracking system.
- **Why it's special:** Instead of building separate tracking for "driver compliance" and "vehicle compliance", we use polymorphic querying. Based on the `entity_type` column ('driver' or 'vehicle'), our SQL query uses a `CASE WHEN` statement to dynamically fetch either the driver's name or the vehicle's license plate directly inside the query execution.

---

## Summary of the Engineering Philosophy

1. **Don't Touch the Frontend:** We bent the backend to match the frontend. We kept Laravel's pagination style, Laravel's URL patterns, and Laravel's FormData preferences.
2. **Zero Trust Security:** Every query relies on `token.org_id`. A user physically cannot query another organization's data by tampering with API parameters because the `org_id` is extracted securely from the cryptographically signed JWT.
3. **No SQL Injection:** All database inputs use parameterized queries (`$1, $2, etc.`). We never use string interpolation for user input.
4. **Cloud Native:** By shifting file uploads directly to Azure Blob Storage, the backend compute layer remains stateless, meaning Azure can scale it horizontally from 1 server to 100 servers under heavy load instantly without losing uploaded files.
