const BASE = "https://func-institue-api-ddh5hrcfajbtddfk.southindia-01.azurewebsites.net/api";

async function debug() {
  // Login first
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@aequs.com", password: "Aequs@2026" })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  console.log("Token:", token ? "acquired" : "MISSING");

  // Call broadcasts/stats
  const res = await fetch(`${BASE}/broadcasts/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  console.log("Status:", res.status);
  const body = await res.text();
  console.log("Body:", body);
}

debug();
