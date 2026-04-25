import pool from './src/lib/db';

const DEFAULT_PERMISSIONS = [
  "view dashboard",
  "view role permissions",
  "create role permissions",
  "edit role permissions",
  "delete role permissions",
  "view employees",
  "create employees",
  "edit employees",
  "delete employees",
  "view vehicles",
  "create vehicles",
  "edit vehicles",
  "delete vehicles",
  "view drivers",
  "create drivers",
  "edit drivers",
  "delete drivers",
  "view travellers",
  "create travellers",
  "edit travellers",
  "delete travellers",
  "view bookings",
  "view vendors",
  "view feedbacks",
  "view reports",
  "view settings",
];

async function seed() {
  try {
    console.log('Seeding permissions into schema1...');
    for (const name of DEFAULT_PERMISSIONS) {
      await pool.query(
        `INSERT INTO schema1.institute_permissions (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [name]
      );
    }
    console.log('Seeding complete!');
  } catch (err: any) {
    console.error('Seed failed:', err.message);
  }
  process.exit(0);
}

seed();
