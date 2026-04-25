-- Migration 002: Institute V2 Expansion
-- Date: 2026-04-23
-- Description: Consolidates all V2 updates for Roles, Compliance, and Vehicle Registration modules.

-- 1. Roles & Permissions Table Updates
ALTER TABLE schema1.institute_roles 
ADD COLUMN IF NOT EXISTS department VARCHAR(100),
ADD COLUMN IF NOT EXISTS access_level VARCHAR(50),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active',
ADD COLUMN IF NOT EXISTS created_by VARCHAR(255);

-- 2. Compliance Module Table
CREATE TABLE IF NOT EXISTS schema1.institute_compliance (
    id SERIAL PRIMARY KEY,
    org_id VARCHAR(100) NOT NULL,
    vehicle_id INTEGER REFERENCES schema1.institute_vehicles(id),
    document_type VARCHAR(100),
    document_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Vehicle Module V2 Expansion
ALTER TABLE schema1.institute_vehicles 
ADD COLUMN IF NOT EXISTS kilometers_driven INTEGER,
ADD COLUMN IF NOT EXISTS gps_sim_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS beacon_count INTEGER,
ADD COLUMN IF NOT EXISTS assigned_driver_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS assigned_route_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS owner_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS owner_contact_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS organisation_fleet_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS fitness_certificate_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS pollution_certificate_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS fire_extinguisher VARCHAR(50),
ADD COLUMN IF NOT EXISTS first_aid_kit VARCHAR(50),
ADD COLUMN IF NOT EXISTS cctv_installed VARCHAR(20),
ADD COLUMN IF NOT EXISTS panic_button_installed VARCHAR(20),
ADD COLUMN IF NOT EXISTS owner_id_proof TEXT,
ADD COLUMN IF NOT EXISTS vendor_agreement TEXT;
