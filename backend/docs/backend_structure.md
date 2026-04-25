# Technical Migration Guide: Laravel PHP to MERN (Institute Panel)

This guide provides a comprehensive technical blueprint for migrating the existing Laravel backend to a Node.js Express + TypeScript environment, specifically designed for the Institute Panel architecture.

---

## 1. Project Organization (Monorepo)

Based on the requirement, the project uses a monorepo structure.

```text
institute-panel/
├── frontend/               # React + Vite (Current logic)
└── backend/                # Node.js + Express + TypeScript
    ├── src/
    │   ├── api/            # Route handlers (Controllers)
    │   ├── models/         # Mongoose Schemas (Central & Tenant)
    │   ├── routes/         # Express Route definitions
    │   ├── middleware/     # Auth, Tenancy, Validation, Error Handling
    │   ├── services/       # Third-party integrations (Azure, Mail, etc.)
    │   ├── config/         # Environment and DB connection pooling
    │   ├── types/          # TypeScript interfaces/types
    │   └── app.ts          # Server entry point
    ├── tsconfig.json
    └── package.json
```

---

## 2. Key Migration Aspects

### A. Multi-Tenancy Model (PostgreSQL)
Instead of switching MongoDB connections, we use **Schema Isolation** or **Database Isolation** in PostgreSQL.
- **Central Schema**: Stores global data (Organisations, Plans).
- **Tenant Schemas**: Each institute gets its own PostgreSQL schema (e.g., `tenant_dps`) within the same database or a separate database entirely.
- **ORM**: Using **Prisma** to manage schemas and migrations.

### B. Database Strategy (PostgreSQL)
- **Primary DB**: `vanloka_main`
- **Tenancy**: Use a dynamic Prisma Client provider to switch schemas based on the `x-tenant-id` header.

---

## 3. PostgreSQL Database Schema (Prisma)

### A. Central Models
```prisma
// Central Organisation
model Organisation {
  id            Int      @id @default(autoincrement())
  name          String
  slug          String   @unique
  logo          String?
  primaryColor  String?
  status        String   @default("trial") // active, suspended, trial
  planId        Int
  plan          Plan     @relation(fields: [planId], references: [id])
  expiresAt     DateTime?
  createdAt     DateTime @default(now())
}

model Plan {
  id           Int            @id @default(autoincrement())
  name         String
  maxVehicles  Int
  maxStaff     Int
  features     String[]       // Array of strings
  billingCycle String         // monthly, yearly
  price        Float
  organisations Organisation[]
}
```

### B. Tenant Models
```prisma
// Vehicle & Real-time tracking
model Vehicle {
  id             Int       @id @default(autoincrement())
  vehicle_name   String
  vehicle_number String    @unique
  model          String?
  make           String?
  capacity       Int?
  status         String    @default("active")
  gps_device_id  String?
  battery        Int?
  lat            Float?
  lng            Float?
  speed          Float?
  lastGpsUpdate  DateTime?
  beacons        Beacon[]
  bookings       Booking[]
}

model Beacon {
  id         String   @id // UUID/MAC
  name       String
  type       String   // driver, traveller
  lastSeen   DateTime
  rssi       Int?
  vehicleId  Int
  vehicle    Vehicle  @relation(fields: [vehicleId], references: [id])
}

model Staff {
  id          Int      @id @default(autoincrement())
  firstName   String
  lastName    String
  email       String   @unique
  phone       String?
  designation String?
  status      String   @default("active")
}

model Booking {
  id             Int      @id @default(autoincrement())
  vehicleId      Int
  vehicle        Vehicle  @relation(fields: [vehicleId], references: [id])
  pickupLat      Float
  pickupLng      Float
  pickupName     String
  dropLat        Float?
  dropLng        Float?
  dropName       String?
  scheduledAt    DateTime
  status         String   @default("pending")
}
```

---

## 4. Page-Specific API Requirements

Based on the frontend modules, here are the APIs required for each page:

### Area: Dashboard
*   **Page**: `DashboardPage.tsx`
*   **Required APIs**:
    *   `GET /api/tenant/vehicles/live/location/:tenantId` (Fetches all active vehicles + GPS + onboard Beacons)
    *   `GET /api/tenant/stats/summary` (Total vehicles, active staff, today's bookings count)

### Area: Vehicle Management
*   **Pages**: `VehicleIndexPage`, `VehicleCreatePage`, `VehicleEditPage`
*   **Required APIs**:
    *   `POST /api/tenant/vehicles` (Create new vehicle)
    *   `GET /api/tenant/vehicles/:id` (Fetch single vehicle details)
    *   `PUT /api/tenant/vehicles/:id` (Update vehicle)
    *   `DELETE /api/tenant/vehicles/:id` (Archive vehicle)
    *   `GET /api/tenant/vehicles/track/:id` (Real-time tracking for a single unit)

### Area: Staff & Drivers
*   **Pages**: `StaffIndexPage`, `StaffCreatePage`, `StaffEditPage`
*   **Required APIs**:
    *   `GET /api/tenant/staff` (List all staff)
    *   `POST /api/tenant/staff` (Register new staff)
    *   `GET /api/tenant/staff/:id` (Details)
    *   `PUT /api/tenant/staff/:id` (Update roles/permissions)

### Area: Bookings
*   **Pages**: `BookingIndexPage`, `BookingCreatePage`
*   **Required APIs**:
    *   `GET /api/tenant/bookings` (Upcoming/Past bookings)
    *   `POST /api/tenant/bookings` (New booking request)
    *   `PATCH /api/tenant/bookings/:id/status` (Update status to confirmed/cancelled)

### Area: Hardware (GPS & Beacons)
*   **Pages**: `GpsDevices`, `BeaconDevices`
*   **Required APIs**:
    *   `GET /api/tenant/devices/gps` (Inventory of GPS units)
    *   `GET /api/tenant/devices/beacons` (Inventory of Beacons)
    *   `POST /api/tenant/devices/assign` (Link a GPS/Beacon to a vehicle)

---

## 5. Global API Route Mapping (Refined)

Based on the `API_ROUTES.pdf` specification:

### Central Administration (`/api/`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/login` | System-wide admin login |
| `GET` | `/api/organisations` | List all institutes |
| `POST` | `/api/onboarding` | Register a new institute |
| `GET` | `/api/masters/pickup-locations` | Global pickup points |

### Tenant Operations (`/api/tenant/`)
*Requires `x-tenant-id` header*
| Method | Route | Description |
| :--- | :--- | :--- |
| `POST` | `/api/tenant/login` | Institute-specific login |
| `GET` | `/api/tenant/employees` | List institute employees |
| `POST` | `/api/tenant/vehicles` | Add new fleet vehicle |
| `GET` | `/api/tenant/bookings` | Manage institute bookings |

### End-User App (`/api/user-app/`)
| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/user-app/travellers` | Traveller profile |
| `POST` | `/api/user-app/bookings` | Create a new booking |
| `GET` | `/api/user-app/vehicles/track/:id` | Live tracking (External sensors) |

---

## 5. Technical Stack for Azure Deployment

To ensure full compatibility with your future **Azure** deployment:

1.  **Server**: Node.js 20+ on **Azure App Service**.
2.  **Database**: **Azure SQL Database** or **PostgreSQL on Azure**.
3.  **Storage**: **Azure Blob Storage** for file uploads (replaces S3).
4.  **Auth**: **Azure AD B2C** or Custom JWT (HS256) with Prisma.
5.  **Caching**: **Azure Cache for Redis** (optional).

---

## 6. Development Tips

1.  **Validation**: Use **Zod** to validate incoming request bodies. It generates automatic TypeScript types.
2.  **Error Handling**: Create a `GlobalErrorHandler` middleware. Never use `try-catch` in every controller; use a `catchAsync` wrapper instead.
3.  **Logging**: Use `morgan` for HTTP logs and `winston` for application logs (crucial for Azure Monitor).
4.  **Environment**: Keep a `.env.template` file to track required variables like `DATABASE_URL`, `JWT_SECRET`, and `AZURE_STORAGE_CONNECTION_STRING`.

---

## 7. Migration Checklist from PHP Laravel

- [ ] **Auth**: Convert Laravel `Bcrypt` passwords or re-hash on first login (Node `bcryptjs` is compatible if the rounds are same).
- [ ] **Middlewares**: Replace Laravel's `auth:api` and `tenant` middlewares with Express equivalents.
- [ ] **Storage**: Move `public/storage` logic to Azure Blob Storage SDK.
- [ ] **Eloquent to Prisma**: Map Table Relationships to Prisma `relations`.

---

## 8. Step-by-Step Backend Initialization (using Bun)

Follow these steps to start the backend with PostgreSQL, TypeScript, and **Bun**:

### Step 1: Initialize Backend Folder
```bash
# From the project root
mkdir backend
cd backend
bun init -y
```

### Step 2: Install Core Dependencies
```bash
# Runtime dependencies
bun add express cors helmet dotenv jsonwebtoken bcryptjs zod

# Dev dependencies
bun add -d typescript @types/express @types/cors @types/node @types/jsonwebtoken @types/bcryptjs
```

### Step 3: Setup PostgreSQL with Prisma
```bash
# Install Prisma
bun add -d prisma
bun add @prisma/client

# Initialize Prisma
bunx prisma init
```
*Tip: Edit your `.env` file with your PostgreSQL connection string (`DATABASE_URL`).*

### Step 4: Define the Schema
Copy the Prisma models from Section 3 into your `backend/prisma/schema.prisma` file.

### Step 5: Run First Migration
```bash
bunx prisma migrate dev --name init
```

### Step 6: Create Basic Server (`src/app.ts`)
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();
const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.send('OK'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
```

### Step 7: Update `package.json` Scripts
```json
"scripts": {
  "dev": "bun --watch src/app.ts",
  "build": "bun build ./src/app.ts --outdir ./dist",
  "start": "bun src/app.ts"
}
```
