# Login Implementation Guide

## Overview

We connected the React frontend login page to the Azure Functions backend API so that when a user enters their email and password, it gets verified against the PostgreSQL `users` table.

---

## Step 1 — Set the Backend URL

**File:** `.env` (created new in project root)

```env
VITE_API_BASE_URL=http://localhost:7071/api
```

**Why:** The frontend needs to know where the backend is running. Azure Functions runs on port `7071` by default. Vite reads this env variable at startup.

**Also updated:** `src/services/api.ts` — changed the fallback URL from `localhost:3001` to `localhost:7071` so it works even without the `.env` file.

---

## Step 2 — Rewrote the Auth Context

**File:** `src/components/auth/AuthContext.tsx`

**Before:** Used a fake "dev adapter" with hardcoded accounts (admin@vanloka.com, busadmin@mds.com, etc.). No real API calls. Simulated login with `setTimeout`.

**After:** Makes a real HTTP call to the backend:

```
POST http://localhost:7071/api/auth/login
Body: { "email": "...", "password": "..." }
```

**What the new AuthContext does:**

1. **`signIn(email, password)`** — Calls the login API. On success, stores the JWT token and user info in React state + localStorage.

2. **`signOut()`** — Clears the token from state and localStorage, redirects to `/login`.

3. **Session restore** — On page refresh, reads the token from localStorage. If it's still valid (not expired), restores the session automatically without requiring re-login.

4. **Token refresh** — Schedules a proactive token refresh 2 minutes before the JWT expires by calling `POST /api/auth/refresh`.

5. **Wires up api.ts** — Calls `configureApiAuth()` so all future API requests (vehicles, staff, etc.) automatically include `Authorization: Bearer <token>` in the header.

**Key:** The login page (`LoginPage.tsx`) was NOT changed. It already called `useAuth().signIn(email, password)` — we just changed what `signIn` does internally.

---

## Step 3 — Fixed the Backend Login Function

**File:** `api/functions/auth/login.ts`

### Fix 1: Wrong Table
- **Before:** Queried `mds_roles` table (which stores role definitions, not login credentials)
- **After:** Queries the `users` table (which has the actual email/password)

```sql
-- Before (wrong)
SELECT * FROM mds_roles WHERE login_email = $1

-- After (correct)
SELECT * FROM users WHERE email = $1
```

### Fix 2: Role Mapping
- **Before:** Only recognized `role === "admin"` or `role === "owner"`
- **After:** Recognizes `ORG_ADMIN`, `SUPER_ADMIN`, and any role containing "admin" or "owner"

```javascript
// Before (missed ORG_ADMIN)
const isOwner = user.role === "admin" || user.role === "owner";

// After (catches all admin roles)
const roleLower = user.role.toLowerCase();
const isOwner = roleLower.includes("admin") || roleLower.includes("owner");
```

---

## Step 4 — Fixed the CORS Preflight Crash

**File:** `api/shared/response.ts`

HTTP status 204 (No Content) cannot have a body. The `preflight()` function was returning `body: ""` which crashed the Azure Functions runtime.

```javascript
// Before (crashes)
export const preflight = () => ({ status: 204, headers: cors, body: "" });

// After (works)
export const preflight = () => ({ status: 204, headers: cors });
```

---

## Step 5 — Fixed CORS Origin Mismatch

**File:** `api/local.settings.json`

The frontend was running on port `5174` but CORS only allowed `5173`. The browser blocked all API responses.

```json
// Before (blocked port 5174)
"ALLOWED_ORIGIN": "http://localhost:5173"

// After (allows any origin in development)
"ALLOWED_ORIGIN": "*"
```

> **Note:** Change this to the actual domain in production.

---

## How It All Connects

```
┌──────────────────────────────────────────────────────────┐
│  FRONTEND  (React, port 5173/5174)                       │
│                                                          │
│  LoginPage.tsx                                           │
│    └─ calls useAuth().signIn(email, password)            │
│                                                          │
│  AuthContext.tsx                                          │
│    └─ fetch("http://localhost:7071/api/auth/login",      │
│          { email, password })                            │
│    └─ stores token + user in state & localStorage        │
│    └─ redirects to /dashboard                            │
│                                                          │
│  api.ts (for all subsequent requests)                    │
│    └─ auto-attaches Authorization: Bearer <token>        │
└───────────────────────┬──────────────────────────────────┘
                        │  HTTP POST
                        ▼
┌──────────────────────────────────────────────────────────┐
│  BACKEND  (Azure Functions, port 7071)                   │
│                                                          │
│  functions/auth/login.ts                                 │
│    └─ SELECT * FROM users WHERE email = $1               │
│    └─ bcrypt.compare(password, hash)                     │
│    └─ signToken({ sub, email, org_id, role, ... })       │
│    └─ returns { token, user }                            │
└───────────────────────┬──────────────────────────────────┘
                        │  SQL Query
                        ▼
┌──────────────────────────────────────────────────────────┐
│  DATABASE  (PostgreSQL on Azure)                         │
│                                                          │
│  users table:                                            │
│    id | email              | password (bcrypt) | role    │
│    31 | admin@aequs.com    | $2b$10$vKc...     | ORG_ADM │
└──────────────────────────────────────────────────────────┘
```

---

## Files Changed (Summary)

| # | File | What |
|---|---|---|
| 1 | `.env` | New — backend URL |
| 2 | `src/services/api.ts` | 1 line — default URL |
| 3 | `src/components/auth/AuthContext.tsx` | Full rewrite — real API calls |
| 4 | `api/functions/auth/login.ts` | Fixed table + role mapping |
| 5 | `api/shared/response.ts` | Fixed 204 crash |
| 6 | `api/local.settings.json` | Fixed CORS |

---

## Adding New Users

Any new user your partner adds to the `users` table will work immediately:

```sql
INSERT INTO users (email, password, role, org_id) 
VALUES ('newuser@company.com', '<bcrypt_hash>', 'ORG_ADMIN', 32);
```

The password **must be bcrypt hashed** — not plain text.
