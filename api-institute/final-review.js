const BASE = "https://func-institue-api-ddh5hrcfajbtddfk.southindia-01.azurewebsites.net/api";

async function finalReview() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║     FINAL PRODUCTION REVIEW — ALL FIXES DEPLOYED      ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Login as admin@horizon.com
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@horizon.com", password: "Horizon@2026" })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  const user = loginData.data?.user;
  console.log(`✅ LOGIN: ${loginRes.status}`);
  console.log(`   User: ${user.name} | Role: ${user.roleName} | OrgId: ${user.orgId}`);
  console.log(`   Permissions: ${JSON.stringify(user.permissions)}`);

  const h = { "Authorization": `Bearer ${token}` };
  let pass = 1, fail = 0;

  // Test auth/refresh (the fixed endpoint)
  const refreshRes = await fetch(`${BASE}/auth/refresh`, { headers: h });
  const refreshData = await refreshRes.json();
  const refreshUser = refreshData.data?.user;
  console.log(`\n${refreshRes.status === 200 ? '✅' : '❌'} AUTH/REFRESH: ${refreshRes.status}`);
  if (refreshUser) {
    console.log(`   Refresh returns user: ${refreshUser.email} | Role: ${refreshUser.roleName} | OrgId: ${refreshUser.orgId}`);
    pass++;
  } else {
    console.log(`   ❌ NO USER DATA in refresh response!`);
    fail++;
  }

  // Organization/me (Settings page)
  const orgRes = await fetch(`${BASE}/organization/me`, { headers: h });
  const orgData = await orgRes.json();
  console.log(`\n${orgRes.status === 200 ? '✅' : '❌'} ORGANIZATION/ME (Settings): ${orgRes.status}`);
  if (orgRes.status === 200) {
    const d = orgData.data;
    console.log(`   Name: ${d.name} | Type: ${d.type} | OrgID: ${d.org_id}`);
    pass++;
  } else { fail++; }

  // All module endpoints
  const endpoints = [
    { name: "Dashboard Stats", url: "/dashboard/stats" },
    { name: "Roles", url: "/roles" },
    { name: "Employees (Staff)", url: "/employees" },
    { name: "Vehicles", url: "/vehicles" },
    { name: "Drivers", url: "/drivers" },
    { name: "Travellers", url: "/travellers" },
    { name: "Bookings", url: "/bookings" },
    { name: "Compliance", url: "/compliance" },
    { name: "Broadcasts", url: "/broadcasts" },
    { name: "Devices", url: "/devices" },
    { name: "Permissions", url: "/permissions" },
  ];

  console.log("\n── ALL MODULE ENDPOINTS ──");
  for (const ep of endpoints) {
    const res = await fetch(`${BASE}${ep.url}`, { headers: h });
    const ok = res.status === 200;
    if (ok) pass++; else fail++;
    const data = await res.json().catch(() => ({}));
    const inner = data.data;
    let count = '';
    if (Array.isArray(inner)) count = `${inner.length} records`;
    else if (inner?.data && Array.isArray(inner.data)) count = `${inner.data.length} records (total: ${inner.total || '?'})`;
    else if (inner && typeof inner === 'object') count = Object.keys(inner).join(', ');
    console.log(`  ${ok ? '✅' : '❌'} [${res.status}] ${ep.name.padEnd(22)} ${count}`);
  }

  // CRUD test — create a role, verify, delete
  console.log("\n── CRUD TEST: Role Create → Read → Delete ──");
  const createRes = await fetch(`${BASE}/roles`, {
    method: "POST",
    headers: { ...h, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "TEST_ROLE_DELETE_ME",
      department: "IT & Systems",
      access_level: "Read Only",
      description: "Automated test role",
      permissions: [],
      status: "Active"
    })
  });
  const created = await createRes.json();
  const roleId = created.data?.id;
  console.log(`  ${createRes.status === 200 || createRes.status === 201 ? '✅' : '❌'} CREATE: ${createRes.status} → id=${roleId}`);
  if (roleId) {
    pass++;
    // Delete it
    const delRes = await fetch(`${BASE}/roles/${roleId}`, { method: "DELETE", headers: h });
    console.log(`  ${delRes.status === 200 ? '✅' : '❌'} DELETE: ${delRes.status}`);
    if (delRes.status === 200) pass++; else fail++;
  } else { fail++; }

  // Security
  console.log("\n── SECURITY ──");
  const secRes = await fetch(`${BASE}/employees`);
  const secOk = secRes.status === 401;
  if (secOk) pass++; else fail++;
  console.log(`  ${secOk ? '✅' : '❌'} No-token blocked: ${secRes.status}`);

  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log(`║  TOTAL: ${pass + fail} tests | ✅ Passed: ${pass} | ❌ Failed: ${fail}            ║`);
  console.log("╚════════════════════════════════════════════════════════╝");

  if (fail === 0) {
    console.log("\n🎉 ALL SYSTEMS GO. Everything is working.\n");
  } else {
    console.log(`\n⚠️  ${fail} test(s) need attention.\n`);
  }

  // Summary of frontend fixes
  console.log("── FRONTEND FIXES APPLIED ──");
  console.log("  1. ApiService.ts     → 401 interceptor: excludes auth endpoints, debounce prevents loops");
  console.log("  2. AuthContext.tsx    → refreshMe: correctly maps user.roleName, permissions from refresh");
  console.log("  3. RolesPermissions/IndexPage.tsx → data extraction: handles paginated {data:{data:[]}} structure");
  console.log("  4. StaffIndexPage.tsx → roles fetch: handles paginated structure");
  console.log("  5. StaffCreatePage.tsx → roles fetch: handles paginated structure");
  console.log("  6. StaffEditPage.tsx  → roles fetch: handles paginated structure");
  console.log("  7. RolesPermissions/CreatePage.tsx → permissions fetch: handles paginated structure");
  console.log("  8. SettingsPage.tsx   → org_id field mapping: uses org_id instead of id");

  console.log("\n── BACKEND FIXES APPLIED ──");
  console.log("  1. auth/refresh.ts → now returns user data (id, email, roleName, permissions, orgId)");
  console.log("  2. organization/me.ts → queries public.organizations (not empty schema1 table)");
}

finalReview().catch(console.error);
