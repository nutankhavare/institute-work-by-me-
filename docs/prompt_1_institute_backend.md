# PROMPT 1 — VanLoka Institute Admin Panel: New Azure Functions Backend
## (Legacy Laravel PHP → React + Azure Functions + MongoDB Migration)

---

## CONTEXT — READ THIS FIRST BEFORE ANYTHING ELSE

This project has a specific and important history that shapes every decision you make:

The **VanLoka Institute Admin Panel** was originally a **Laravel PHP monolith** — a classic server-rendered PHP application with Eloquent ORM, PHP controllers, Laravel routes, and a PostgreSQL database whose schema (`schema1.institute_*` tables) was managed by Laravel migrations. The entire frontend was server-rendered Blade templates.

That frontend has been **completely torn out and rewritten in React + Vite + TypeScript**. The React frontend was not built from scratch — it was **cloned directly from the Laravel Blade UI** and converted component-by-component. This means:

1. **Every API route the React frontend calls is a Laravel route** — the URLs, HTTP methods, request body field names, and response shapes are all Laravel conventions, not REST-API-first conventions. The React developers kept calling the same URLs the Laravel controllers used to handle.

2. **The database schema already exists** — `schema1.institute_*` tables in PostgreSQL are live, created by Laravel migrations. You do NOT create new tables. You write Azure Functions that query these existing tables exactly as they are.

3. **The pagination format is Laravel's `paginate()` output** — because the React components were converted from Blade views that consumed Laravel paginator data. Every list endpoint must return this exact Laravel paginator envelope, because the React components parse `response.data.data`, `response.data.current_page`, `response.data.last_page`, etc.

4. **Every form sends `multipart/form-data`** — Laravel forms with file upload fields. The React devs kept `enctype="multipart/form-data"` behavior via FormData in Axios. None of the endpoints receive JSON — they all receive FormData.

5. **There is a colleague's Azure Functions project (`/api` folder)** that serves a different module (MDS/Instructor app). You must read it completely for architectural conventions — the Azure Functions v4 programmatic model, shared utilities (`shared/db.ts`, `shared/auth.ts`, `shared/response.ts`), the `withTenant()` RLS pattern, JWT auth, error handling, `ok()`/`err()`/`preflight()` helpers. Your new functions follow the same architecture but serve the Institute Admin Panel's Laravel-origin routes and Laravel-origin DB schema.

6. **This is an Azure project** — Azure Functions v4 (Node.js 20, TypeScript) as the compute layer, Azure PostgreSQL Flexible Server as the database, Azure Blob Storage for file uploads. The stack is **MERN-adjacent**: MongoDB is NOT used here — the "M" in this context means the frontend consumes APIs via Axios (React), the backend is Azure Functions (Node.js), and the DB is PostgreSQL (already provisioned and populated via Laravel migrations).

---

## PART 0 — READ EVERY FILE IN /api BEFORE WRITING ANY CODE (MANDATORY)

Open and read every single file in the `/api` folder completely. Do not skip any file.

```
/api/
├── package.json
├── host.json
├── tsconfig.json
├── local.settings.json
├── shared/
│   ├── db.ts           ← Pool singleton, getPool(), withTenant(client, orgId)
│   ├── auth.ts         ← MdsToken interface, requireAuth(req), signToken()
│   └── response.ts     ← ok(data, meta?), err(status, message), preflight()
└── functions/
    ├── index.ts        ← Master import — how all functions are registered
    ├── auth/login.ts
    ├── auth/refresh.ts
    ├── roles/index.ts
    ├── roles/byId.ts
    ├── staff/index.ts
    ├── staff/byId.ts
    ├── vehicles/index.ts
    ├── vehicles/byId.ts
    ├── vehicles/live.ts
    ├── dashboard/stats.ts
    ├── sessions/index.ts
    ├── sessions/updateStatus.ts
    ├── instructors/index.ts
    ├── instructors/byId.ts
    ├── trainees/index.ts
    ├── trainees/byId.ts
    └── fees/index.ts
```

From reading these files, internalize and note down:

- The exact signature of `app.http(name, { route, methods, authLevel, handler })`
- The exact flow: OPTIONS check → `requireAuth(req)` → `getPool().connect()` → `withTenant(client, orgId)` → SQL → `ok()`/`err()` → `finally { client.release() }`
- The `MdsToken` interface fields: `sub`, `org_id`, `permissions`
- How `ok(data, meta)` constructs `{ success: true, data, meta, error: null }`
- How `err(status, message)` constructs `{ success: false, data: null, error: { message } }`
- How PostgreSQL error codes `23505` (duplicate) and `23503` (FK violation) are caught
- How `result.rowCount === 0` triggers a 404 on DELETE
- The `COALESCE($n, column)` pattern in UPDATE queries
- How `host.json` is configured (extension bundle v4)
- How `tsconfig.json` is set (CommonJS, ES2020, strict: false)
- How `functions/index.ts` imports every function file

This is your **single architectural source of truth**. Every new function you write must be structurally identical.

---

## PART 1 — THE EXISTING DATABASE SCHEMA

The following tables exist in PostgreSQL under the `schema1` schema. They were created by Laravel migrations and must not be modified. Write SQL queries targeting them exactly as defined below.

```sql
-- Employees (Laravel: App\Models\Employee)
schema1.institute_employees (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  employee_id VARCHAR(50),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender VARCHAR(20),
  email VARCHAR(255),
  phone VARCHAR(20),
  designation VARCHAR(100),
  department VARCHAR(100),
  employment_type VARCHAR(50),
  joining_date DATE,
  dob DATE,
  address TEXT,
  address2 TEXT,
  landmark TEXT,
  state VARCHAR(100),
  district VARCHAR(100),
  city VARCHAR(100),
  pin_code VARCHAR(10),
  emergency_name VARCHAR(100),
  emergency_phone VARCHAR(20),
  emergency_email VARCHAR(255),
  bank_name VARCHAR(100),
  account_holder VARCHAR(100),
  account_number VARCHAR(50),
  ifsc VARCHAR(20),
  profile_photo_url TEXT,
  role_id BIGINT,
  roles JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'Active',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Vehicles (Laravel: App\Models\Vehicle)
schema1.institute_vehicles (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  model VARCHAR(100),
  manufacturer VARCHAR(100),
  vehicle_type VARCHAR(50),
  year INTEGER,
  fuel_type VARCHAR(30),
  seating_capacity INTEGER,
  colour VARCHAR(30),
  status VARCHAR(20) DEFAULT 'Active',
  gps_device_id VARCHAR(100),
  sim_number VARCHAR(20),
  gps_install_date DATE,
  assigned_driver VARCHAR(100),
  ownership_type VARCHAR(30),
  owner_name VARCHAR(100),
  owner_contact VARCHAR(20),
  insurance_provider VARCHAR(100),
  insurance_policy_no VARCHAR(50),
  insurance_expiry DATE,
  permit_type VARCHAR(30),
  permit_number VARCHAR(50),
  permit_issue DATE,
  permit_expiry DATE,
  fitness_cert_no VARCHAR(50),
  fitness_expiry DATE,
  pollution_cert_no VARCHAR(50),
  pollution_expiry DATE,
  last_service DATE,
  next_service DATE,
  km_driven INTEGER,
  fire_extinguisher BOOLEAN DEFAULT FALSE,
  first_aid_kit BOOLEAN DEFAULT FALSE,
  cctv BOOLEAN DEFAULT FALSE,
  panic_button BOOLEAN DEFAULT FALSE,
  rc_book_doc TEXT,
  insurance_doc TEXT,
  fitness_doc TEXT,
  pollution_doc TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Drivers (Laravel: App\Models\Driver)
schema1.institute_drivers (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  gender VARCHAR(20),
  dob DATE,
  email VARCHAR(255),
  mobile_number VARCHAR(20),
  blood_group VARCHAR(10),
  marital_status VARCHAR(20),
  profile_photo_url TEXT,
  employment_type VARCHAR(50),
  employee_id VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  district VARCHAR(100),
  state VARCHAR(100),
  pin_code VARCHAR(10),
  assigned_vehicle_id BIGINT,
  beacon_id VARCHAR(100),
  operational_base VARCHAR(100),
  current_status VARCHAR(20) DEFAULT 'Active',
  status VARCHAR(20) DEFAULT 'Active',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Driver License/Insurance (Laravel: App\Models\DriverLicenseInsurance)
schema1.institute_driver_license_insurance (
  id BIGSERIAL PRIMARY KEY,
  driver_id BIGINT NOT NULL REFERENCES schema1.institute_drivers(id) ON DELETE CASCADE,
  dl_number VARCHAR(50),
  dl_issue_date DATE,
  dl_expiry_date DATE,
  license_type VARCHAR(50),
  driving_experience INTEGER,
  insurance_policy_no VARCHAR(50),
  insurance_expiry DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Roles (Laravel: App\Models\Role)
schema1.institute_roles (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  access_level VARCHAR(50) DEFAULT 'Partial Access',
  description TEXT,
  permissions JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Permissions (Laravel: App\Models\Permission — seeded lookup table)
schema1.institute_permissions (
  id BIGSERIAL PRIMARY KEY,
  module_name VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Travellers (Laravel: App\Models\Traveller)
schema1.institute_travellers (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  route VARCHAR(255),
  boarding_point VARCHAR(255),
  beacon_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Bookings (Laravel: App\Models\Booking)
schema1.institute_bookings (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  traveller_id BIGINT REFERENCES schema1.institute_travellers(id),
  vehicle_id BIGINT REFERENCES schema1.institute_vehicles(id),
  route VARCHAR(255),
  booking_date DATE,
  pickup_point VARCHAR(255),
  status VARCHAR(20) DEFAULT 'Pending',
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Compliance (Laravel: App\Models\Compliance)
schema1.institute_compliance (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  entity_type VARCHAR(30) NOT NULL,
  entity_id BIGINT NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  document_number VARCHAR(100),
  issue_date DATE,
  expiry_date DATE,
  status VARCHAR(20) DEFAULT 'Valid',
  document_url TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Devices (Laravel: App\Models\Device)
schema1.institute_devices (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL,
  device_id VARCHAR(100) NOT NULL,
  device_type VARCHAR(20) NOT NULL,
  serial_number VARCHAR(100),
  assigned_vehicle_id BIGINT,
  battery_percent INTEGER,
  last_seen TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)

-- Organization Settings (Laravel: App\Models\Organization)
schema1.institute_organizations (
  id BIGSERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL UNIQUE,
  name VARCHAR(255),
  type VARCHAR(100),
  registration_no VARCHAR(100),
  gst_number VARCHAR(50),
  pan_number VARCHAR(50),
  status VARCHAR(20) DEFAULT 'Active',
  subscription_plan VARCHAR(50),
  logo_url TEXT,
  address JSONB DEFAULT '{}',
  contact JSONB DEFAULT '{}',
  institute JSONB DEFAULT '{}',
  documents JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

---

## PART 2 — CRITICAL DECISIONS ALREADY MADE FOR YOU

### Decision 1: Laravel-Style Pagination (Non-Negotiable)
Every list endpoint returns this exact envelope — the React components parse these exact field names because they were converted from Laravel Blade views:

```json
{
  "success": true,
  "data": {
    "data": [ ...rows ],
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 73,
    "from": 1,
    "to": 15
  },
  "error": null
}
```

Pagination query params from the frontend: `page` (1-indexed), `per_page` (default 15).
SQL: `LIMIT $per_page OFFSET ($page - 1) * $per_page`
`last_page = CEIL(total / per_page)`
`from = ($page - 1) * $per_page + 1`
`to = MIN($page * $per_page, total)`

### Decision 2: multipart/form-data for All Create/Update Operations
All POST and PUT requests from the frontend send `multipart/form-data`. Never `application/json`. You need a shared `shared/multipart.ts` utility using `busboy` to parse both text fields and file buffers.

### Decision 3: File Upload Strategy
For uploaded files (photos, documents), save them to **Azure Blob Storage** using the `@azure/storage-blob` npm package. Store only the resulting blob URL in the database column. Add a `shared/blob.ts` utility that wraps `BlobServiceClient` uploads.

If Azure Blob Storage credentials are not configured in local settings, fall back to a local temp path URL pattern `/uploads/{filename}` so local dev works without Azure.

### Decision 4: Target schema1.institute_* Tables
All queries use the `schema1` schema prefix. Example: `SELECT * FROM schema1.institute_employees`. Never query `public.mds_*` tables from this project.

### Decision 5: Keep Colleague's Azure Functions Architectural Patterns
Use `app.http()`, `requireAuth()`, `withTenant()`, `ok()`, `err()`, `preflight()` exactly as established in `/api`. Do not invent new patterns.

### Decision 6: Laravel Route Conventions
The routes the React frontend calls are Laravel-style. Match them exactly:
- `GET /employees` (not `/staff`)
- `PUT /employees/{id}` (not PATCH)
- `POST /travellers/update/{id}` (Laravel resource controller override — register this route explicitly)
- `GET /vehicles/live/location/{tenantId}` (with tenantId path param)
- `GET /vehicles/track/{vehicleNumber}/live/location/{tenantId}`
- `GET /gps-device/for/dropdown` (Laravel route naming convention)
- `GET /active-vehicles/for/dropdown`
- `GET /beacon-device/for/dropdown`
- `GET /organization/me`
- `PUT /organization/me`

---

## PART 3 — NEW SHARED UTILITIES TO CREATE

### `shared/multipart.ts`

```typescript
// Purpose: Parse multipart/form-data requests from the React frontend
// Package: busboy (add to package.json)
// Returns:
export interface MultipartResult {
  fields: Record<string, string>;
  files: Record<string, {
    buffer: Buffer;
    mimetype: string;
    filename: string;
    size: number;
  }>;
}
export async function parseMultipart(req: HttpRequest): Promise<MultipartResult>
```

- Use `busboy` to parse the incoming request body stream
- Buffer all file parts in memory (reject files > 10MB with a clear error)
- Return when all parts are consumed (`finish` event)
- Handle requests with no files gracefully (return empty `files: {}`)

### `shared/blob.ts`

```typescript
// Purpose: Upload a file buffer to Azure Blob Storage and return public URL
// Package: @azure/storage-blob (add to package.json)
// Env vars needed: AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_CONTAINER_NAME
export async function uploadToBlob(
  buffer: Buffer,
  filename: string,
  mimetype: string,
  folder: string  // e.g., 'employees', 'vehicles', 'drivers'
): Promise<string>  // returns the full blob URL
```

- Generate a unique filename: `{folder}/{uuid}-{originalFilename}`
- If `AZURE_STORAGE_CONNECTION_STRING` is not set, return a local fallback URL `/uploads/{folder}/{filename}`
- Set `blobHTTPHeaders.blobContentType` to the file's mimetype

---

## PART 4 — COMPLETE FILE STRUCTURE TO BUILD

```
api/                          ← Existing colleague project root (do not rename)
├── shared/
│   ├── db.ts                 ← DO NOT TOUCH
│   ├── auth.ts               ← DO NOT TOUCH
│   ├── response.ts           ← DO NOT TOUCH
│   ├── multipart.ts          ← CREATE NEW
│   └── blob.ts               ← CREATE NEW
│
└── functions/
    ├── index.ts              ← MODIFY: add imports for all new functions
    │
    ├── auth/                 ← LEAVE AS-IS (already working)
    │
    ├── dashboard/
    │   └── stats.ts          ← MODIFY: extend to include employee + driver counts from schema1
    │
    ├── roles/
    │   ├── index.ts          ← MODIFY: fix field name mapping, target schema1.institute_roles
    │   └── byId.ts           ← MODIFY: add GET handler
    │
    ├── permissions/
    │   └── index.ts          ← CREATE: GET /permissions
    │
    ├── employees/
    │   ├── index.ts          ← CREATE: GET /employees + POST /employees
    │   └── byId.ts           ← CREATE: GET /employees/{id} + PUT /employees/{id} + DELETE /employees/{id}
    │
    ├── vehicles/
    │   ├── index.ts          ← MODIFY: target schema1.institute_vehicles, add FormData support
    │   ├── byId.ts           ← MODIFY: add GET handler, add FormData support for PUT
    │   ├── live.ts           ← MODIFY: fix route to /vehicles/live/location/{tenantId}
    │   └── trackSingle.ts    ← CREATE: GET /vehicles/track/{vehicleNumber}/live/location/{tenantId}
    │
    ├── drivers/
    │   ├── index.ts          ← CREATE: GET /drivers + POST /drivers
    │   ├── byId.ts           ← CREATE: GET /drivers/{id} + POST /drivers/{id} + DELETE /drivers/{id}
    │   └── dropdowns.ts      ← CREATE: GET /active-vehicles/for/dropdown + GET /beacon-device/for/dropdown + GET /gps-device/for/dropdown
    │
    ├── travellers/
    │   ├── index.ts          ← CREATE: GET /travellers + POST /travellers
    │   └── byId.ts           ← CREATE: GET /travellers/{id} + POST /travellers/update/{id} + DELETE /travellers/{id}
    │
    ├── bookings/
    │   ├── index.ts          ← CREATE: GET /bookings + POST /bookings
    │   └── byId.ts           ← CREATE: GET /bookings/{id} + PUT /bookings/{id}
    │
    ├── compliance/
    │   ├── index.ts          ← CREATE: GET /compliance + POST /compliance
    │   └── byId.ts           ← CREATE: DELETE /compliance/{id}
    │
    └── organization/
        └── me.ts             ← CREATE: GET /organization/me + PUT /organization/me
```

---

## PART 5 — FUNCTION-BY-FUNCTION SPECIFICATIONS

Use this exact boilerplate for every single function — no exceptions:

```typescript
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { getPool, withTenant } from "../../shared/db";
import { requireAuth } from "../../shared/auth";
import { ok, err, preflight } from "../../shared/response";

app.http("uniqueFunctionName", {
  route: "route-path/{optional-param}",
  methods: ["GET", "POST", "OPTIONS"],  // only the methods this handler serves
  authLevel: "anonymous",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const token = requireAuth(req);
      client = await getPool().connect();
      await withTenant(client, token.org_id);
      // --- your SQL and logic here ---
      return ok(data);
    } catch (e: any) {
      ctx.error(e);
      if (e.status) return err(e.status, e.message);
      if (e.code === "23505") return err(409, "Record already exists");
      if (e.code === "23503") return err(404, "Related record not found");
      return err(500, "Internal server error");
    } finally {
      client?.release();
    }
  }
});
```

---

### 5.1 — `dashboard/stats.ts` (EXTEND EXISTING)

Add these two queries alongside existing ones, querying schema1 tables:
```sql
SELECT COUNT(*) FROM schema1.institute_employees WHERE org_id = $1 AND status = 'Active'
SELECT COUNT(*) FROM schema1.institute_drivers WHERE org_id = $1 AND status = 'Active'
```
Add `employeeCount` and `driverCount` to the existing response object.

---

### 5.2 — `roles/index.ts` (FIX EXISTING)

**GET /roles**
- Change query target from `mds_roles` to `schema1.institute_roles`
- Add `WHERE org_id = $1` using `token.org_id`
- Add pagination: `page`, `per_page` query params
- Return **Laravel-style pagination envelope**
- Each role row: join to permissions to expand `permissions` from `[1, 2, 3]` JSONB array to `[{ id, name }]` objects

**POST /roles**
- Parse JSON body (roles create/edit is JSON, not FormData)
- Frontend sends: `{ name, department, access_level, permissions: number[], status }`
- Map to DB columns: `name → name` (column IS `name` in institute_roles), `access_level → access_level`, `permissions → permissions::jsonb`
- INSERT into `schema1.institute_roles` with `org_id = token.org_id`

---

### 5.3 — `roles/byId.ts` (ADD GET HANDLER)

**GET /roles/{id}**
- Register as new method alongside existing PUT/DELETE
- `SELECT r.*, COALESCE(json_agg(json_build_object('id', p.id, 'name', p.action)) FILTER (WHERE p.id IS NOT NULL), '[]'::json) as permission_objects FROM schema1.institute_roles r LEFT JOIN schema1.institute_permissions p ON p.id::text = ANY(SELECT jsonb_array_elements_text(r.permissions)) WHERE r.id = $1 AND r.org_id = $2 GROUP BY r.id`
- Return 404 if not found

**PUT /roles/{id}**
- COALESCE pattern
- Frontend sends `{ name, department, access_level, permissions, status }`

---

### 5.4 — `permissions/index.ts` (NEW)

**GET /permissions**
- `SELECT * FROM schema1.institute_permissions ORDER BY module_name, action`
- Group result by module_name:
```typescript
const grouped = rows.reduce((acc, row) => {
  if (!acc[row.module_name]) acc[row.module_name] = { module: row.module_name, permissions: [] };
  acc[row.module_name].permissions.push({ id: row.id, action: row.action, description: row.description });
  return acc;
}, {});
return ok(Object.values(grouped));
```

---

### 5.5 — `employees/index.ts` (NEW)

**GET /employees**

Query params: `page` (default 1), `per_page` (default 15), `search`, `status`

Count query:
```sql
SELECT COUNT(*) FROM schema1.institute_employees
WHERE org_id = $1
  AND ($2::text IS NULL OR status = $2)
  AND ($3::text IS NULL OR (
    first_name ILIKE '%' || $3 || '%' OR
    last_name ILIKE '%' || $3 || '%' OR
    email ILIKE '%' || $3 || '%' OR
    phone ILIKE '%' || $3 || '%' OR
    employee_id ILIKE '%' || $3 || '%'
  ))
```

Data query (add LIMIT/OFFSET):
```sql
SELECT e.*, r.name as role_name
FROM schema1.institute_employees e
LEFT JOIN schema1.institute_roles r ON r.id = e.role_id
WHERE e.org_id = $1
  AND ($2::text IS NULL OR e.status = $2)
  AND ($3::text IS NULL OR (...search conditions...))
ORDER BY e.created_at DESC
LIMIT $4 OFFSET $5
```

Return Laravel-style pagination envelope.

**POST /employees**

- Parse with `parseMultipart(req)` from `shared/multipart.ts`
- If `fields.profilePhoto` file present, upload via `uploadToBlob()` → get URL
- Map fields (frontend sends snake_case FormData field names from converted Laravel form):
  - `first_name`, `last_name`, `gender`, `email`, `phone`, `designation`, `department`
  - `employment_type`, `joining_date`, `dob`, `address`, `address2`, `landmark`
  - `state`, `district`, `city`, `pin_code`
  - `emergency_name`, `emergency_phone`, `emergency_email`
  - `bank_name`, `account_holder`, `account_number`, `ifsc`
  - `role_id`, `status`, `remarks`
- INSERT into `schema1.institute_employees`
- Return created row wrapped in `ok()`

---

### 5.6 — `employees/byId.ts` (NEW)

**GET /employees/{id}**
```sql
SELECT e.*, r.name as role_name
FROM schema1.institute_employees e
LEFT JOIN schema1.institute_roles r ON r.id = e.role_id
WHERE e.id = $1 AND e.org_id = $2
```
Return 404 if `rows.length === 0`.

**PUT /employees/{id}**
- Parse with `parseMultipart(req)`
- If new profile photo file: upload → update `profile_photo_url`
- COALESCE pattern for all fields:
```sql
UPDATE schema1.institute_employees SET
  first_name = COALESCE($3, first_name),
  last_name = COALESCE($4, last_name),
  -- ... all fields ...
  updated_at = NOW()
WHERE id = $1 AND org_id = $2
RETURNING *
```

**DELETE /employees/{id}**
```sql
DELETE FROM schema1.institute_employees WHERE id = $1 AND org_id = $2
```
Check `result.rowCount === 0` → `err(404, "Employee not found")`
Return `ok({ deleted: true })`

---

### 5.7 — `vehicles/index.ts` (MODIFY EXISTING)

Update existing function to:
- Change table from `mds_vehicles` to `schema1.institute_vehicles`
- Add `multipart/form-data` parsing for POST (use `parseMultipart`)
- File uploads: `rc_book_doc`, `insurance_doc`, `fitness_doc`, `pollution_doc` → blob URLs
- Laravel-style pagination for GET
- All existing field logic adapted to `institute_vehicles` column names

**GET /vehicles** — params: `page, per_page, search` (vehicle_number/model/manufacturer), `status`

**POST /vehicles** — FormData with document file uploads

---

### 5.8 — `vehicles/byId.ts` (MODIFY EXISTING — ADD GET + FIX PUT)

**GET /vehicles/{id}** (ADD THIS — currently only PUT/DELETE exist)
```sql
SELECT * FROM schema1.institute_vehicles WHERE id = $1 AND org_id = $2
```
Return 404 if not found.

**PUT /vehicles/{id}** (FIX — change to accept FormData)
- Parse with `parseMultipart(req)`
- Upload any new document files to blob
- COALESCE update all fields in `schema1.institute_vehicles`

**DELETE /vehicles/{id}** — keep existing but change table to `schema1.institute_vehicles`

---

### 5.9 — `vehicles/live.ts` (FIX ROUTE)

Frontend calls: `GET /vehicles/live/location/{tenantId}`
Current function is registered as: `GET /vehicles/live`

Change the `app.http()` registration:
```typescript
app.http("vehiclesLive", {
  route: "vehicles/live/location/{tenantId}",  // ← CHANGE THIS
  methods: ["GET", "OPTIONS"],
  ...
})
```

Inside handler:
- Extract `tenantId` from `req.params.tenantId`
- **Validate**: `if (Number(tenantId) !== token.org_id) return err(403, "Forbidden")`
- Keep the same telemetry query logic but target `schema1.institute_vehicle_telemetry` if it exists, or adapt to your existing telemetry table

---

### 5.10 — `vehicles/trackSingle.ts` (NEW)

**GET /vehicles/track/{vehicleNumber}/live/location/{tenantId}**

```typescript
app.http("vehiclesTrackSingle", {
  route: "vehicles/track/{vehicleNumber}/live/location/{tenantId}",
  methods: ["GET", "OPTIONS"],
  authLevel: "anonymous",
  handler: async (req, ctx) => {
    if (req.method === "OPTIONS") return preflight();
    let client;
    try {
      const token = requireAuth(req);
      const { vehicleNumber, tenantId } = req.params;
      if (Number(tenantId) !== token.org_id) return err(403, "Forbidden");
      client = await getPool().connect();
      await withTenant(client, token.org_id);
      // Get latest telemetry for this specific vehicle
      const result = await client.query(`
        SELECT t.*, v.vehicle_number, v.model, v.status as vehicle_status
        FROM schema1.institute_vehicle_telemetry t
        JOIN schema1.institute_vehicles v ON v.id = t.vehicle_id
        WHERE v.vehicle_number = $1 AND v.org_id = $2
        ORDER BY t.recorded_at DESC
        LIMIT 1
      `, [vehicleNumber, token.org_id]);
      if (result.rows.length === 0) return err(404, "Vehicle not found or no telemetry data");
      return ok(result.rows[0]);
    } catch (e: any) { ... } finally { client?.release(); }
  }
});
```

---

### 5.11 — `drivers/index.ts` (NEW)

**GET /drivers**

Query params: `page` (default 1), `per_page` (default 15), `search` (name/email/mobile_number/employee_id), `status`

```sql
-- Count
SELECT COUNT(*) FROM schema1.institute_drivers
WHERE org_id = $1
  AND ($2::text IS NULL OR status = $2)
  AND ($3::text IS NULL OR (
    first_name ILIKE '%' || $3 || '%' OR
    last_name ILIKE '%' || $3 || '%' OR
    mobile_number ILIKE '%' || $3 || '%' OR
    employee_id ILIKE '%' || $3 || '%' OR
    email ILIKE '%' || $3 || '%'
  ))

-- Data
SELECT d.*,
  li.dl_number, li.dl_expiry_date, li.license_type,
  v.vehicle_number as assigned_vehicle_number
FROM schema1.institute_drivers d
LEFT JOIN schema1.institute_driver_license_insurance li ON li.driver_id = d.id
LEFT JOIN schema1.institute_vehicles v ON v.id = d.assigned_vehicle_id
WHERE d.org_id = $1 ...
ORDER BY d.created_at DESC
LIMIT $4 OFFSET $5
```

Return Laravel-style pagination envelope.

**POST /drivers**
- Parse with `parseMultipart(req)`
- File: `profile_photo` → blob URL → `profile_photo_url`
- Main driver fields: `first_name, last_name, gender, dob, email, mobile_number, blood_group, marital_status, employment_type, employee_id, address, city, district, state, pin_code, assigned_vehicle_id, beacon_id, operational_base, status, remarks`
- License fields (from same FormData): `dl_number, dl_issue_date, dl_expiry_date, license_type, driving_experience, insurance_policy_no, insurance_expiry`

**Wrap in a database transaction:**
```sql
BEGIN;
INSERT INTO schema1.institute_drivers (...) VALUES (...) RETURNING id;
INSERT INTO schema1.institute_driver_license_insurance (driver_id, ...) VALUES ($driver_id, ...);
COMMIT;
```

Return created driver with license info joined.

---

### 5.12 — `drivers/byId.ts` (NEW)

**GET /drivers/{id}**
```sql
SELECT d.*,
  li.dl_number, li.dl_issue_date, li.dl_expiry_date, li.license_type,
  li.driving_experience, li.insurance_policy_no, li.insurance_expiry,
  v.vehicle_number as assigned_vehicle_number, v.model as assigned_vehicle_model
FROM schema1.institute_drivers d
LEFT JOIN schema1.institute_driver_license_insurance li ON li.driver_id = d.id
LEFT JOIN schema1.institute_vehicles v ON v.id = d.assigned_vehicle_id
WHERE d.id = $1 AND d.org_id = $2
```
Return 404 if not found.

**POST /drivers/{id}** (NOTE: frontend uses POST not PUT for driver update — match this exactly)
```typescript
app.http("driversById", {
  route: "drivers/{id}",
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  ...
})
```
- In handler, branch on `req.method`:
  - `GET` → fetch driver
  - `POST` → update driver (parse FormData, COALESCE update driver + update license sub-record in transaction)
  - `DELETE` → delete driver

**DELETE /drivers/{id}**
- Transaction: delete license record first (or rely on CASCADE), then delete driver
- Check `rowCount` on driver delete → 404 if 0
- Return `ok({ deleted: true })`

---

### 5.13 — `drivers/dropdowns.ts` (NEW)

Three separate `app.http()` registrations in one file:

**GET /active-vehicles/for/dropdown**
```sql
SELECT id, vehicle_number, model FROM schema1.institute_vehicles
WHERE org_id = $1 AND status = 'Active'
ORDER BY vehicle_number ASC
```

**GET /beacon-device/for/dropdown**
```sql
SELECT id, device_id, serial_number FROM schema1.institute_devices
WHERE org_id = $1 AND device_type = 'BLE' AND status = 'Active'
ORDER BY device_id ASC
```

**GET /gps-device/for/dropdown**
```sql
SELECT id, device_id, serial_number FROM schema1.institute_devices
WHERE org_id = $1 AND device_type = 'GPS' AND status = 'Active'
ORDER BY device_id ASC
```

---

### 5.14 — `travellers/index.ts` (NEW)

**GET /travellers**

Query params: `page, per_page, search` (first_name/last_name/phone/email), `status`

Laravel-style pagination. Standard pattern.

**POST /travellers**
- Parse body — travellers form may be JSON or FormData, check `Content-Type` header
- If `multipart/form-data`: use `parseMultipart`, map `first_name, last_name, email, phone, route, boarding_point, beacon_id, status`
- If `application/json`: parse body directly
- INSERT into `schema1.institute_travellers`

---

### 5.15 — `travellers/byId.ts` (NEW)

This file registers **two separate `app.http()` calls** — one for `/travellers/{id}` and one for the Laravel-legacy `/travellers/update/{id}` route.

**GET /travellers/{id}** and **DELETE /travellers/{id}**
```typescript
app.http("travellersById", {
  route: "travellers/{id}",
  methods: ["GET", "DELETE", "OPTIONS"],
  ...
})
```

**POST /travellers/update/{id}** (Laravel resource controller override route — must match exactly)
```typescript
app.http("travellersUpdate", {
  route: "travellers/update/{id}",
  methods: ["POST", "OPTIONS"],
  ...
})
```
- Parse FormData, COALESCE update in `schema1.institute_travellers`
- Return updated row

**IMPORTANT**: Register `travellersUpdate` (`travellers/update/{id}`) BEFORE `travellersById` (`travellers/{id}`) in `functions/index.ts` to prevent route shadowing.

---

### 5.16 — `bookings/index.ts` (NEW)

**GET /bookings**

Query params: `page, per_page, search` (booking id/traveller name), `status`

```sql
SELECT b.*,
  t.first_name || ' ' || t.last_name as traveller_name, t.phone as traveller_phone,
  v.vehicle_number, v.model as vehicle_model
FROM schema1.institute_bookings b
LEFT JOIN schema1.institute_travellers t ON t.id = b.traveller_id
LEFT JOIN schema1.institute_vehicles v ON v.id = b.vehicle_id
WHERE b.org_id = $1 ...
ORDER BY b.created_at DESC
LIMIT $4 OFFSET $5
```

Laravel-style pagination.

**POST /bookings**
- Parse JSON body: `{ traveller_id, vehicle_id, route, booking_date, pickup_point, status, remarks }`
- INSERT into `schema1.institute_bookings`

---

### 5.17 — `bookings/byId.ts` (NEW)

**GET /bookings/{id}**
```sql
-- Booking detail with joins
SELECT b.*,
  t.first_name || ' ' || t.last_name as traveller_name, t.phone, t.email,
  v.vehicle_number, v.model, v.seating_capacity
FROM schema1.institute_bookings b
LEFT JOIN schema1.institute_travellers t ON t.id = b.traveller_id
LEFT JOIN schema1.institute_vehicles v ON v.id = b.vehicle_id
WHERE b.id = $1 AND b.org_id = $2
```

Also fetch available vehicles:
```sql
SELECT id, vehicle_number, model, seating_capacity
FROM schema1.institute_vehicles
WHERE org_id = $1 AND status = 'Active'
ORDER BY vehicle_number
```

Return: `ok({ booking: {...}, vehicles: [...] })` — frontend destructures this exact shape.

**PUT /bookings/{id}**
- COALESCE update: `vehicle_id, traveller_id, route, booking_date, pickup_point, status, remarks`
- Return updated row

---

### 5.18 — `compliance/index.ts` (NEW)

**GET /compliance**

Query params: `page, per_page, search, status, category` (maps to `entity_type`: `vehicle`/`driver`)

```sql
SELECT c.*,
  CASE c.entity_type
    WHEN 'vehicle' THEN (SELECT vehicle_number FROM schema1.institute_vehicles WHERE id = c.entity_id)
    WHEN 'driver' THEN (SELECT first_name || ' ' || last_name FROM schema1.institute_drivers WHERE id = c.entity_id)
  END as entity_name,
  (c.expiry_date - CURRENT_DATE) as days_until_expiry
FROM schema1.institute_compliance c
WHERE c.org_id = $1
  AND ($2::text IS NULL OR c.status = $2)
  AND ($3::text IS NULL OR c.entity_type = $3)
  AND ($4::text IS NULL OR c.document_type ILIKE '%' || $4 || '%')
ORDER BY c.expiry_date ASC
LIMIT $5 OFFSET $6
```

**POST /compliance**
- Parse with `parseMultipart(req)`
- File: `document_file` → blob URL → `document_url`
- Fields: `entity_type, entity_id, document_type, document_number, issue_date, expiry_date, status, remarks`
- INSERT into `schema1.institute_compliance`

---

### 5.19 — `compliance/byId.ts` (NEW)

**DELETE /compliance/{id}**
```sql
DELETE FROM schema1.institute_compliance WHERE id = $1 AND org_id = $2
```
Check `rowCount` → 404 if 0. Return `ok({ deleted: true })`.

---

### 5.20 — `organization/me.ts` (NEW)

**GET /organization/me**
```sql
SELECT * FROM schema1.institute_organizations WHERE org_id = $1
```
If no record: return 404 with message "Organization profile not configured".

**PUT /organization/me**
- Parse with `parseMultipart(req)`
- Files: `logo`, `pan_doc`, `gst_doc`, `registration_doc` → upload to blob → store URLs in `documents` JSONB
- Text fields: `name, type, registration_no, gst_number, pan_number, status, subscription_plan`
- JSONB fields (parse as JSON strings from FormData): `address`, `contact`, `institute`
- **Upsert pattern** (since org may or may not have a profile row yet):
```sql
INSERT INTO schema1.institute_organizations (org_id, name, type, ...)
VALUES ($1, $2, $3, ...)
ON CONFLICT (org_id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  ...
  updated_at = NOW()
RETURNING *
```

---

## PART 6 — `functions/index.ts` UPDATES

Add these imports in this exact order (order matters for route conflict resolution):

```typescript
// Existing imports — keep all of these
import "./auth/login";
import "./auth/refresh";
// ... all existing imports

// New Institute Admin Panel functions
// Utilities (no route conflicts)
import "./permissions/index";

// Employees
import "./employees/index";
import "./employees/byId";

// Roles (modified existing — already imported, just update the file)

// Vehicles
import "./vehicles/trackSingle";     // specific route — before live if needed
import "./vehicles/live";            // MODIFIED: route changed to vehicles/live/location/{tenantId}

// Drivers
import "./drivers/dropdowns";        // /active-vehicles/for/dropdown etc — register before drivers/{id}
import "./drivers/index";
import "./drivers/byId";

// Travellers — CRITICAL ORDER: update route before parameterized ID route
import "./travellers/byId";          // registers BOTH travellers/update/{id} AND travellers/{id}
import "./travellers/index";

// Bookings
import "./bookings/index";
import "./bookings/byId";

// Compliance
import "./compliance/index";
import "./compliance/byId";

// Organization
import "./organization/me";
```

---

## PART 7 — PACKAGE.JSON ADDITIONS

Add these to the existing `/api/package.json`:

```json
{
  "dependencies": {
    "busboy": "^1.6.0",
    "@azure/storage-blob": "^12.17.0"
  },
  "devDependencies": {
    "@types/busboy": "^1.5.4"
  }
}
```

---

## PART 8 — LOCAL SETTINGS ADDITIONS

Add these to the existing `/api/local.settings.json` `Values` object:

```json
{
  "AZURE_STORAGE_CONNECTION_STRING": "DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net",
  "AZURE_STORAGE_CONTAINER_NAME": "institute-uploads"
}
```

---

## PART 9 — CROSS-CUTTING RULES (NEVER VIOLATE)

1. Every function: `if (req.method === "OPTIONS") return preflight();` is line 1
2. Every function: `requireAuth(req)` called before any DB access
3. Every function: `withTenant(client, token.org_id)` called before any query
4. Every `WHERE` clause: includes `org_id = $1` using `token.org_id` from JWT — never from URL params
5. Every `INSERT`: includes `org_id` from `token.org_id`
6. Every `UPDATE`: uses `COALESCE($n, column_name)` for every updatable field
7. Every `DELETE`: checks `result.rowCount === 0` → `err(404, ...)`
8. PostgreSQL error code `23505` → `err(409, "Record already exists")`
9. PostgreSQL error code `23503` → `err(404, "Related record not found")`
10. All SQL uses parameterized `$1, $2` — **zero string interpolation** — ever
11. All schema1 table references: fully qualified as `schema1.table_name`
12. All list endpoints: return **Laravel-style pagination envelope** (current_page, last_page, per_page, total, from, to, data[])
13. All create/update endpoints that have file fields: use `parseMultipart()` from `shared/multipart.ts`
14. All file uploads: go through `uploadToBlob()` from `shared/blob.ts`
15. `client.release()` always in `finally` block — connection leaks are fatal in Azure Functions
16. All DB column names: `snake_case` in queries; response field names: match exactly what the Laravel backend would have returned (also `snake_case`) since React components were converted from Laravel views
17. Transactions (drivers create, drivers delete): use `BEGIN`/`COMMIT`/`ROLLBACK` pattern

---

## PART 10 — DELIVERY FORMAT

Output files in this exact order. Every file must be 100% complete, compilable TypeScript. No `// TODO`, no `// implement this`, no placeholders. Every SQL query written out in full with all parameters.

1. `shared/multipart.ts`
2. `shared/blob.ts`
3. `functions/permissions/index.ts`
4. `functions/employees/index.ts`
5. `functions/employees/byId.ts`
6. `functions/vehicles/byId.ts` (modified — show full file)
7. `functions/vehicles/live.ts` (modified — show full file)
8. `functions/vehicles/trackSingle.ts`
9. `functions/vehicles/index.ts` (modified — show full file)
10. `functions/roles/index.ts` (modified — show full file)
11. `functions/roles/byId.ts` (modified — show full file)
12. `functions/drivers/index.ts`
13. `functions/drivers/byId.ts`
14. `functions/drivers/dropdowns.ts`
15. `functions/travellers/index.ts`
16. `functions/travellers/byId.ts`
17. `functions/bookings/index.ts`
18. `functions/bookings/byId.ts`
19. `functions/compliance/index.ts`
20. `functions/compliance/byId.ts`
21. `functions/organization/me.ts`
22. `functions/dashboard/stats.ts` (modified — show full file)
23. `functions/index.ts` (modified — show full complete import block)
24. `package.json` (modified — show full file)
