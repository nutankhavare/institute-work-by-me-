const BASE = "https://func-institue-api-ddh5hrcfajbtddfk.southindia-01.azurewebsites.net/api";

async function test() {
  // Login as admin@horizon.com (the user in the screenshot)
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@horizon.com", password: "Aequs@2026" })
  });
  
  if (loginRes.status !== 200) {
    console.log("Login failed:", loginRes.status);
    // Try admin@aequs.com instead
    const loginRes2 = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@aequs.com", password: "Aequs@2026" })
    });
    if (loginRes2.status !== 200) {
      console.log("Both logins failed");
      return;
    }
    const loginData2 = await loginRes2.json();
    const token = loginData2.data?.token || loginData2.token;
    console.log("Logged in as admin@aequs.com, org_id=32");
    
    // Test organization/me
    const orgRes = await fetch(`${BASE}/organization/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    console.log("\n=== GET /organization/me ===");
    console.log("Status:", orgRes.status);
    const orgData = await orgRes.json();
    console.log("Response:", JSON.stringify(orgData, null, 2));
    return;
  }

  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  console.log("Logged in as admin@horizon.com, org_id=38");
  console.log("User data:", JSON.stringify(loginData.data?.user || loginData.user, null, 2));

  // Test organization/me
  const orgRes = await fetch(`${BASE}/organization/me`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("\n=== GET /organization/me ===");
  console.log("Status:", orgRes.status);
  const orgData = await orgRes.json();
  console.log("Response:", JSON.stringify(orgData, null, 2));

  // Test dashboard/stats 
  const dashRes = await fetch(`${BASE}/dashboard/stats`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("\n=== GET /dashboard/stats ===");
  console.log("Status:", dashRes.status);
  const dashData = await dashRes.json();
  console.log("Response:", JSON.stringify(dashData, null, 2));

  // Test roles
  const rolesRes = await fetch(`${BASE}/roles`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  console.log("\n=== GET /roles ===");
  console.log("Status:", rolesRes.status);
  const rolesData = await rolesRes.json();
  console.log("Response:", JSON.stringify(rolesData, null, 2));
}

test();
