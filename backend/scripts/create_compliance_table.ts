import pool from "./src/lib/db";

async function createComplianceTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema1.institute_compliance (
        id SERIAL PRIMARY KEY,
        org_id UUID NOT NULL,
        document_name TEXT NOT NULL,
        sub_law_reference TEXT,
        registration_number TEXT NOT NULL,
        category TEXT NOT NULL,
        authority_name TEXT NOT NULL,
        authority_contact TEXT,
        date_recorded DATE NOT NULL DEFAULT CURRENT_DATE,
        status TEXT NOT NULL DEFAULT 'Pending Review',
        applies_to JSONB DEFAULT '[]',
        remarks TEXT,
        document_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Table institute_compliance created successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error creating table:", err);
    process.exit(1);
  }
}

createComplianceTable();
