const BASE_URL = 'https://func-institue-api-ddh5hrcfajbtddfk.southindia-01.azurewebsites.net/api';

async function rigorousTest() {
    console.log(`Starting Rigorous E2E Test for Institute API...\n`);

    // 1. Login
    console.log(`[TEST] POST /auth/login`);
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@questglobal.com',
            password: 'QuestGlobal@2026'
        })
    });

    if (!loginRes.ok) {
        console.error(`❌ Login failed: ${loginRes.status}`);
        console.log(await loginRes.text());
        return;
    }

    const { data: { token } } = await loginRes.json();
    console.log(`✅ Login successful. Token acquired.`);

    const endpoints = [
        'dashboard/stats',
        'organization/me',
        'employees',
        'roles',
        'vehicles',
        'drivers',
        'travellers',
        'bookings',
        'compliance',
        'broadcasts/stats',
        'devices',
        'masters/forms/dropdowns/states'
    ];

    for (const endpoint of endpoints) {
        const url = `${BASE_URL}/${endpoint}`;
        try {
            const start = Date.now();
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const duration = Date.now() - start;
            
            if (response.ok) {
                console.log(`✅ [${response.status}] ${endpoint} (${duration}ms)`);
            } else {
                const errData = await response.json().catch(() => ({ error: { message: 'Unknown' } }));
                console.log(`❌ [${response.status}] ${endpoint} (${duration}ms)`);
                console.log(`   Error: ${errData.error.message}`);
            }
        } catch (e) {
            console.log(`💥 CRASH ${endpoint}: ${e.message}`);
        }
    }
}

rigorousTest();
