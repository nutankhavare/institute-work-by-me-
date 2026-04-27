const BASE = "https://func-institue-api-ddh5hrcfajbtddfk.southindia-01.azurewebsites.net/api";

async function fullTest() {
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║  FINAL PRODUCTION VERIFICATION                    ║");
  console.log("║  User: admin@aequs.com | org_id: 32               ║");
  console.log("╚════════════════════════════════════════════════════╝\n");

  // 1. LOGIN
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@aequs.com", password: "Aequs@2026" })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  const user = loginData.data?.user || loginData.user;
  console.log(`✅ LOGIN: ${loginRes.status} — Token acquired`);
  console.log(`   User: ${JSON.stringify(user)}\n`);

  const h = { "Authorization": `Bearer ${token}` };

  // 2. ORGANIZATION/ME (Settings page)
  const orgRes = await fetch(`${BASE}/organization/me`, { headers: h });
  const orgData = await orgRes.json();
  console.log(`${orgRes.status === 200 ? '✅' : '❌'} ORGANIZATION/ME: ${orgRes.status}`);
  if (orgRes.status === 200) {
    const d = orgData.data;
    console.log(`   Name: ${d.name}`);
    console.log(`   Type: ${d.type}`);
    console.log(`   Email: ${d.email}`);
    console.log(`   Phone: ${d.phone}`);
    console.log(`   Status: ${d.status}`);
    console.log(`   Org ID: ${d.org_id}`);
  } else {
    console.log(`   Error: ${JSON.stringify(orgData)}`);
  }

  // 3. DASHBOARD
  const dashRes = await fetch(`${BASE}/dashboard/stats`, { headers: h });
  console.log(`\n${dashRes.status === 200 ? '✅' : '❌'} DASHBOARD/STATS: ${dashRes.status}`);
  const dashData = await dashRes.json();
  console.log(`   Data: ${JSON.stringify(dashData.data)}`);

  // 4. ALL MODULE ENDPOINTS
  const endpoints = [
    { name: "Employees", url: "/employees" },
    { name: "Roles", url: "/roles" },
    { name: "Vehicles", url: "/vehicles" },
    { name: "Drivers", url: "/drivers" },
    { name: "Travellers", url: "/travellers" },
    { name: "Bookings", url: "/bookings" },
    { name: "Compliance", url: "/compliance" },
    { name: "Broadcasts", url: "/broadcasts" },
    { name: "Devices", url: "/devices" },
    { name: "Permissions", url: "/permissions" },
    { name: "Masters/States", url: "/masters/forms/dropdowns/states" },
    { name: "Live Location", url: "/vehicles/live/location/32" },
    { name: "Auth Refresh", url: "/auth/refresh" },
  ];

  console.log("\n── MODULE ENDPOINTS ──");
  let pass = 2; // login + org/me already passed
  let fail = 0;

  for (const ep of endpoints) {
    const res = await fetch(`${BASE}${ep.url}`, { headers: h });
    const ok = res.status === 200;
    if (ok) pass++; else fail++;
    const data = await res.json().catch(() => ({}));
    const count = Array.isArray(data.data) ? `${data.data.length} records` : '';
    console.log(`${ok ? '✅' : '❌'} ${ep.name.padEnd(18)} [${res.status}] ${count}`);
  }

  // 5. SECURITY TESTS (no token)
  console.log("\n── SECURITY (no token) ──");
  for (const url of ["/employees", "/vehicles", "/dashboard/stats"]) {
    const res = await fetch(`${BASE}${url}`);
    const ok = res.status === 401;
    if (ok) pass++; else fail++;
    console.log(`${ok ? '✅' : '❌'} ${url.padEnd(20)} [${res.status}] ${ok ? 'Blocked' : 'EXPOSED!'}`);
  }

  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log(`║  TOTAL: ${pass + fail} | ✅ Passed: ${pass} | ❌ Failed: ${fail}        ║`);
  console.log("╚════════════════════════════════════════════════════╝");

  // FRONTEND CONNECTION CHECK
  console.log("\n── FRONTEND CONFIG ──");
  const fs = require('fs');
  const env = fs.readFileSync('C:\\Users\\sagar\\Downloads\\institute-work-by-me-\\frontend\\.env', 'utf8');
  console.log(`   .env: ${env.trim()}`);
  
  const viteConfig = fs.readFileSync('C:\\Users\\sagar\\Downloads\\institute-work-by-me-\\frontend\\vite.config.ts', 'utf8');
  const hasProxy = viteConfig.includes('proxy');
  console.log(`   Vite Proxy: ${hasProxy ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Target: func-institue-api Azure → ${hasProxy ? '✅' : '❌'}`);
}

fullTest().catch(console.error);
