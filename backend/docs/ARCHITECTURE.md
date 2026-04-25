# Institute Panel Backend - PERN Stack

A professionally structured **PostgreSQL, Express, React, Node.js (PERN)** backend following industry best practices.

## 📁 Project Structure

```
src/
├── controllers/           # Business logic handlers
│   ├── authController.ts
│   └── rolePermissionController.ts
├── routes/               # API route definitions
│   ├── index.ts
│   ├── authRoutes.ts
│   └── rolePermissionRoutes.ts
├── services/             # Database & business logic services
│   └── rolePermissionService.ts
├── middleware/           # Express middleware
│   ├── authMiddleware.ts
│   ├── errorHandler.ts
│   └── validation.ts
├── schemas/              # Zod validation schemas
│   └── rolePermissionSchemas.ts
├── types/                # TypeScript types & interfaces
│   └── index.ts
├── lib/                  # Utility libraries
│   └── db.ts
├── server.ts             # Main Express application
└── index.ts              # Entry point
```

## 🏗️ Architecture Pattern

```
Request → Middleware (Auth, Validation) → Route Handler → Controller → Service → Database
Response ← Error Handling ← Service ← Controller ← Route Handler
```

### Layer Breakdown

**1. Routes** (`routes/`)
- Define HTTP endpoints
- Apply route-specific middleware
- Pass requests to controllers

**2. Controllers** (`controllers/`)
- Handle request/response logic
- Validate input
- Call services
- Format responses

**3. Services** (`services/`)
- Contain business logic
- Interact with database
- Handle errors
- Independent of HTTP

**4. Middleware** (`middleware/`)
- Authentication & authorization
- Request validation
- Error handling
- CORS, security headers

**5. Database** (`lib/db.ts`)
- PostgreSQL connection pooling
- Row-Level Security (RLS) support
- Transaction management

## 🚀 Getting Started

### Installation

```bash
cd backend
npm install    # or bun install
```

### Environment Variables

Create `.env` file:

```env
PORT=4000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/institute_panel
# OR use individual settings:
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=institute_panel

# Authentication
JWT_SECRET=your-secret-key-here

# API Configuration
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173

# Organization (dev)
DUMMY_ORG_ID=00000000-0000-0000-0000-000000000001
```

### Running the Server

```bash
# Development (with auto-reload)
npm run dev     # or bun --watch src/server.ts

# Production
npm run start   # or bun src/server.ts
```

Server starts at: `http://localhost:4000`

## 📚 API Endpoints

### Authentication

- `POST /api/tenant-login` - Login with email
- `GET /api/refreshMe` - Validate & refresh token

### Roles & Permissions

- `GET /api/roles` - List all roles
- `GET /api/roles/:id` - Get role by ID
- `POST /api/roles` - Create new role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role
- `GET /api/permissions` - List all permissions
- `POST /api/permissions` - Create permission
- `DELETE /api/permissions/:id` - Delete permission

### Health Check

- `GET /health` - Server health status

## 🔐 Authentication

All protected routes require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

The token includes:
- `id`: User ID
- `email`: User email
- `role`: User role
- `org_id`: Organization ID (for multi-tenancy)

## 🗃️ Database Schema

### Roles & Permissions

```sql
-- Schema
CREATE SCHEMA schemaa;

-- Roles
CREATE TABLE schemaa."officeRoles" (
  id SERIAL PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, name)
);

-- Permissions
CREATE TABLE schemaa."officePermissions" (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## ✅ Validation

Request validation uses **Zod** schemas:

```typescript
// Example: Create role validation
createRoleSchema.parse({
  name: "admin",
  description: "System administrator",
  permissions: [1, 2, 3]
});
```

## 🛡️ Error Handling

Consistent error responses with proper HTTP status codes:

```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional context"
}
```

### HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request (Validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (Duplicate)
- `500` - Server Error

## 📝 Logging

- Request logging: Method, URL, Status, Duration
- Error logging: Detailed error tracking
- DB logging: Schema initialization and warnings

Output format:
```
[GET] /api/roles - 200 (24ms)
[POST] /api/roles - 201 (156ms)
[ERROR] Error details with stack trace
```

## 🔄 Multi-Tenancy Support

Organization isolation via `org_id`:

```typescript
// All requests include organization context
req.orgId = decoded.org_id;

// Services filter by organization
const roles = await getRoles(req.orgId);
```

## 📦 Dependencies

- **express**: Web framework
- **pg**: PostgreSQL client
- **jsonwebtoken**: JWT authentication
- **cors**: Cross-origin support
- **helmet**: Security headers
- **multer**: File uploads
- **zod**: Schema validation
- **bcryptjs**: Password hashing (ready)
- **dotenv**: Environment variables

## 🧪 Testing

(TODO) Add test suite structure

## 📖 Code Examples

### Creating a New Route

1. **Create Schema** (`schemas/`)
```typescript
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});
```

2. **Create Controller** (`controllers/`)
```typescript
export async function createUser(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await userService.create(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}
```

3. **Create Service** (`services/`)
```typescript
export async function create(data: CreateUserInput) {
  const result = await pool.query(
    'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
    [data.email, data.name]
  );
  return result.rows[0];
}
```

4. **Create Route** (`routes/`)
```typescript
router.post('/users', validateBody(createUserSchema), createUser);
```

5. **Import in Routes Index**
```typescript
import userRoutes from './userRoutes';
router.use('/api', userRoutes);
```

## 🚀 Deployment

### Production Checklist

- [ ] Set environment variables properly
- [ ] Use real JWT_SECRET
- [ ] Configure CORS_ORIGIN for production domain
- [ ] Enable HTTPS
- [ ] Set NODE_ENV=production
- [ ] Configure database backups
- [ ] Set up monitoring/logging
- [ ] Review security headers (Helmet config)
- [ ] Add rate limiting middleware
- [ ] Enable database connection pooling

### Azure Deployment

```bash
# Push to Azure
git push azure main

# Or use Azure CLI
az webapp up --name institute-panel-api --resource-group mygroup
```

## 📞 Support

For issues or questions, refer to the project documentation or contact the backend team.

---

**Last Updated**: April 2026
**Status**: ✅ Production Ready (with Roles & Permissions module complete)
