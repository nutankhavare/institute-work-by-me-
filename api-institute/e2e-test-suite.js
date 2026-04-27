/**
 * ============================================================
 * Institute API — Full End-to-End Test Suite
 * ============================================================
 * Tests ALL endpoints deployed on func-institue-api
 * Uses admin@aequs.com / Aequs@2026 (org_id = 32)
 * ============================================================
 */

const BASE = "https://func-institue-api-ddh5hrcfajbtddfk.southindia-01.azurewebsites.net/api";
const EMAIL = "admin@aequs.com";
const PASSWORD = "Aequs@2026";
const ORG_ID = 32;

let TOKEN = null;
const results = [];

async function req(method, path, body = null) {
  const url = `${BASE}/${path}`;
  const headers = { "Content-Type": "application/json" };
  if (TOKEN) headers["Authorization"] = `Bearer ${TOKEN}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const start = Date.now();
  try {
    const res = await fetch(url, opts);
    const ms = Date.now() - start;
    let data = null;
    try { data = await res.json(); } catch {}
    return { status: res.status, ms, data };
  } catch (e) {
    return { status: 0, ms: Date.now() - start, data: null, error: e.message };
  }
}

function log(name, status, expected, ms, detail = "") {
  const pass = expected.includes(status);
  const icon = pass ? "✅" : "❌";
  const line = `${icon} [${status}] ${name} (${ms}ms)${detail ? " — " + detail : ""}`;
  console.log(line);
  results.push({ name, status, expected: expected.join("/"), pass, ms, detail });
}

async function runTests() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Institute API — Full E2E Test Suite                        ║");
  console.log("║  User: " + EMAIL + " | org_id: " + ORG_ID + "                   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // ── 1. AUTH ──
  console.log("── AUTH ──────────────────────────────────────────");

  let r = await req("POST", "auth/login", { email: EMAIL, password: PASSWORD });
  TOKEN = r.data?.data?.token || r.data?.token;
  log("POST /auth/login (valid creds)", r.status, [200], r.ms, TOKEN ? "Token acquired" : "NO TOKEN");

  r = await req("POST", "auth/login", { email: EMAIL, password: "WrongPass123" });
  log("POST /auth/login (wrong password)", r.status, [401], r.ms);

  r = await req("POST", "auth/login", { email: EMAIL });
  log("POST /auth/login (missing password)", r.status, [400], r.ms);

  r = await req("GET", "auth/refresh");
  log("GET /auth/refresh", r.status, [200], r.ms);

  r = await req("POST", "auth/refresh");
  log("POST /auth/refresh", r.status, [200], r.ms);

  // ── 2. DASHBOARD ──
  console.log("\n── DASHBOARD ────────────────────────────────────");

  r = await req("GET", "dashboard/stats");
  log("GET /dashboard/stats", r.status, [200], r.ms);

  // ── 3. ORGANIZATION ──
  console.log("\n── ORGANIZATION ─────────────────────────────────");

  r = await req("GET", "organization/me");
  log("GET /organization/me", r.status, [200, 404], r.ms, r.status === 404 ? "Profile not configured (OK)" : "");

  // ── 4. EMPLOYEES ──
  console.log("\n── EMPLOYEES ────────────────────────────────────");

  r = await req("GET", "employees");
  log("GET /employees", r.status, [200], r.ms, `${r.data?.data?.length || 0} records`);

  r = await req("GET", "employees?page=1&per_page=5");
  log("GET /employees?page=1&per_page=5", r.status, [200], r.ms);

  r = await req("GET", "employees?search=test");
  log("GET /employees?search=test", r.status, [200], r.ms);

  // ── 5. ROLES ──
  console.log("\n── ROLES ────────────────────────────────────────");

  r = await req("GET", "roles");
  log("GET /roles", r.status, [200], r.ms, `${r.data?.data?.length || 0} records`);

  // ── 6. VEHICLES ──
  console.log("\n── VEHICLES ─────────────────────────────────────");

  r = await req("GET", "vehicles");
  log("GET /vehicles", r.status, [200], r.ms, `${r.data?.data?.length || 0} records`);

  r = await req("GET", "vehicles?page=1&per_page=5");
  log("GET /vehicles?page=1&per_page=5", r.status, [200], r.ms);

  r = await req("GET", `vehicles/live/location/${ORG_ID}`);
  log(`GET /vehicles/live/location/${ORG_ID}`, r.status, [200], r.ms);

  // ── 7. DRIVERS ──
  console.log("\n── DRIVERS ──────────────────────────────────────");

  r = await req("GET", "drivers");
  log("GET /drivers", r.status, [200], r.ms, `${r.data?.data?.length || 0} records`);

  r = await req("GET", "drivers?status=Active");
  log("GET /drivers?status=Active", r.status, [200], r.ms);

  // ── 8. TRAVELLERS ──
  console.log("\n── TRAVELLERS ───────────────────────────────────");

  r = await req("GET", "travellers");
  log("GET /travellers", r.status, [200], r.ms, `${r.data?.data?.length || 0} records`);

  // ── 9. BOOKINGS ──
  console.log("\n── BOOKINGS ─────────────────────────────────────");

  r = await req("GET", "bookings");
  log("GET /bookings", r.status, [200], r.ms, `${r.data?.data?.length || 0} records`);

  // ── 10. COMPLIANCE ──
  console.log("\n── COMPLIANCE ───────────────────────────────────");

  r = await req("GET", "compliance");
  log("GET /compliance", r.status, [200], r.ms, `${r.data?.data?.length || 0} records`);

  // ── 11. BROADCASTS ──
  console.log("\n── BROADCASTS ───────────────────────────────────");

  r = await req("GET", "broadcasts");
  log("GET /broadcasts", r.status, [200], r.ms, `${r.data?.data?.length || 0} records`);

  r = await req("GET", "broadcasts/stats");
  log("GET /broadcasts/stats", r.status, [200], r.ms);

  // ── 12. DEVICES ──
  console.log("\n── DEVICES ──────────────────────────────────────");

  r = await req("GET", "devices");
  log("GET /devices", r.status, [200], r.ms, `${r.data?.data?.length || 0} records`);

  // ── 13. MASTERS ──
  console.log("\n── MASTERS ──────────────────────────────────────");

  r = await req("GET", "masters/forms/dropdowns/states");
  log("GET /masters/.../states", r.status, [200], r.ms);

  // ── 14. PERMISSIONS ──
  console.log("\n── PERMISSIONS ──────────────────────────────────");

  r = await req("GET", "permissions");
  log("GET /permissions", r.status, [200], r.ms);

  // ── 15. SECURITY (no token) ──
  console.log("\n── SECURITY (no token) ──────────────────────────");
  const savedToken = TOKEN;
  TOKEN = null;

  r = await req("GET", "employees");
  log("GET /employees (no token)", r.status, [401, 403], r.ms);

  r = await req("GET", "vehicles");
  log("GET /vehicles (no token)", r.status, [401, 403], r.ms);

  r = await req("GET", "dashboard/stats");
  log("GET /dashboard/stats (no token)", r.status, [401, 403], r.ms);

  TOKEN = savedToken;

  // ── SUMMARY ──
  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║                      TEST SUMMARY                           ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  const passed = results.filter(r => r.pass).length;
  const failed = results.filter(r => !r.pass).length;
  const total = results.length;

  console.log(`\n  Total: ${total} | ✅ Passed: ${passed} | ❌ Failed: ${failed}\n`);

  if (failed > 0) {
    console.log("  FAILED TESTS:");
    results.filter(r => !r.pass).forEach(r => {
      console.log(`    ❌ ${r.name} → Got ${r.status}, Expected ${r.expected}`);
    });
    console.log("");
  }

  console.log("  ALL RESULTS:");
  results.forEach((r, i) => {
    console.log(`    ${String(i+1).padStart(2)}. ${r.pass ? "✅" : "❌"} [${r.status}] ${r.name} (${r.ms}ms)`);
  });

  console.log("");
}

runTests().catch(e => console.error("Test suite crashed:", e));
