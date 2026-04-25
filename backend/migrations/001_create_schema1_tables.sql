-- ============================================================
-- Migration: Create schema1 and institute_* tables
-- Database: postgres @ vanloka-postgres.postgres.database.azure.com
-- ============================================================

-- 1. Create the schema
CREATE SCHEMA IF NOT EXISTS schema1;

-- ============================================================
-- 2. Roles & Permissions
-- ============================================================

CREATE TABLE IF NOT EXISTS schema1.institute_roles (
    id              SERIAL PRIMARY KEY,
    org_id          UUID,
    name            VARCHAR(100) NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(org_id, name)
);

CREATE TABLE IF NOT EXISTS schema1.institute_permissions (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schema1.institute_role_permissions (
    id              SERIAL PRIMARY KEY,
    role_id         INT NOT NULL REFERENCES schema1.institute_roles(id) ON DELETE CASCADE,
    permission_id   INT NOT NULL REFERENCES schema1.institute_permissions(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

-- ============================================================
-- 3. Staff / Employee Management
-- ============================================================

CREATE TABLE IF NOT EXISTS schema1.institute_employees (
    id                          SERIAL PRIMARY KEY,
    org_id                      UUID,
    employee_id                 VARCHAR(50),

    -- Photo
    photo                       TEXT,

    -- Employment
    employment_type             VARCHAR(50),
    designation                 VARCHAR(100),
    joining_date                DATE,

    -- Personal
    first_name                  VARCHAR(100) NOT NULL,
    last_name                   VARCHAR(100) NOT NULL,
    gender                      VARCHAR(20),
    marital_status              VARCHAR(20),
    date_of_birth               DATE,
    email                       VARCHAR(150),
    phone                       VARCHAR(20),

    -- Address
    address_line_1              TEXT,
    address_line_2              TEXT,
    landmark                    VARCHAR(150),
    state                       VARCHAR(100),
    district                    VARCHAR(100),
    city                        VARCHAR(100),
    pin_code                    VARCHAR(10),

    -- Emergency Contacts
    primary_person_name         VARCHAR(100),
    primary_person_email        VARCHAR(150),
    primary_person_phone_1      VARCHAR(20),
    primary_person_phone_2      VARCHAR(20),
    secondary_person_name       VARCHAR(100),
    secondary_person_email      VARCHAR(150),
    secondary_person_phone_1    VARCHAR(20),
    secondary_person_phone_2    VARCHAR(20),

    -- Bank Details
    account_holder_name         VARCHAR(150),
    account_number              VARCHAR(50),
    ifsc_code                   VARCHAR(20),
    bank_name                   VARCHAR(100),

    -- Documents
    aadhaar_card                TEXT,
    pan_card                    TEXT,
    bank_proof                  TEXT,

    -- Status
    status                      VARCHAR(20) DEFAULT 'active',
    remarks                     TEXT,

    -- Roles (stored as JSON array of role names)
    roles                       JSONB DEFAULT '[]'::jsonb,

    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schema1.institute_employee_dependants (
    id              SERIAL PRIMARY KEY,
    employee_id     INT NOT NULL REFERENCES schema1.institute_employees(id) ON DELETE CASCADE,
    fullname        VARCHAR(150),
    relation        VARCHAR(50),
    age             INT,
    phone           VARCHAR(20),
    email           VARCHAR(150),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Vehicle Management
-- ============================================================

CREATE TABLE IF NOT EXISTS schema1.institute_vehicles (
    id                              SERIAL PRIMARY KEY,
    org_id                          UUID,

    -- Basic Info
    vehicle_name                    VARCHAR(100),
    vehicle_number                  VARCHAR(50) NOT NULL,
    model                           VARCHAR(100),
    make                            VARCHAR(100),
    capacity                        INT,
    status                          VARCHAR(20) DEFAULT 'active',

    -- GPS
    gps_device_id                   VARCHAR(100),
    battery                         NUMERIC(5,2),
    lat                             NUMERIC(10,7),
    lng                             NUMERIC(10,7),
    speed                           NUMERIC(8,2),
    last_gps_update                 TIMESTAMPTZ,

    -- Vehicle Details
    vehicle_type                    VARCHAR(50),
    rc_number                       VARCHAR(50),
    rc_isued_date                   DATE,
    rc_expiry_date                  DATE,
    manufacturer                    VARCHAR(100),
    vehicle_model                   VARCHAR(100),
    manufacturing_year              VARCHAR(10),
    fuel_type                       VARCHAR(30),
    seating_capacity                INT,
    vehicle_color                   VARCHAR(30),
    kilometers_driven               INT,
    driver                          VARCHAR(100),
    route                           VARCHAR(200),
    gps_device                      VARCHAR(100),
    gps_installation_date           DATE,

    -- Permit
    permit_type                     VARCHAR(50),
    permit_number                   VARCHAR(50),
    permit_issue_date               DATE,
    permit_expiry_date              DATE,

    -- Ownership / Vendor
    ownership_type                  VARCHAR(30),
    vendor_name                     VARCHAR(150),
    vendor_aadhar_number            VARCHAR(20),
    vendor_pan_number               VARCHAR(20),
    vendor_contact_number           VARCHAR(20),
    vendor_organization_name        VARCHAR(150),

    -- Insurance
    insurance_provider_name         VARCHAR(150),
    insurance_policy_number         VARCHAR(50),
    insurance_issued_date           DATE,
    insurance_expiry_date           DATE,

    -- Fitness
    fitness_certificate_number      VARCHAR(50),
    fitness_issued_date             DATE,
    fitness_expiry_date             DATE,

    -- Pollution
    pollution_certificate_number    VARCHAR(50),
    pollution_issued_date           DATE,
    pollution_expiry_date           DATE,

    -- Maintenance
    tax_renewable_date              DATE,
    last_service_date               DATE,
    next_service_due_date           DATE,
    tyre_replacement_due_date       DATE,
    battery_replacement_due_date    DATE,

    -- Safety
    fire_extinguisher               VARCHAR(10),
    first_aid_kit                   VARCHAR(10),
    cctv_installed                  VARCHAR(10),
    panic_button_installed          VARCHAR(10),

    -- Remarks
    remarks                         TEXT,

    -- Document uploads (file paths / URLs)
    insurance_doc                   TEXT,
    rc_book_doc                     TEXT,
    puc_doc                         TEXT,
    fitness_certificate             TEXT,
    permit_copy                     TEXT,
    gps_installation_proof          TEXT,
    saftey_certificate              TEXT,
    vendor_pan                      TEXT,
    vendor_adhaar                   TEXT,
    vendor_bank_proof               TEXT,
    vendor_contract_proof           TEXT,
    vedor_company_registration_doc  TEXT,

    created_at                      TIMESTAMPTZ DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. Driver Management
-- ============================================================

CREATE TABLE IF NOT EXISTS schema1.institute_drivers (
    id                              SERIAL PRIMARY KEY,
    org_id                          UUID,

    -- Basic Information
    first_name                      VARCHAR(100) NOT NULL,
    last_name                       VARCHAR(100) NOT NULL,
    gender                          VARCHAR(20),
    date_of_birth                   DATE,
    email                           VARCHAR(150),
    mobile_number                   VARCHAR(20) NOT NULL,
    blood_group                     VARCHAR(10),
    marital_status                  VARCHAR(20),
    number_of_dependents            INT DEFAULT 0,
    profile_photo                   TEXT,

    -- Emergency Contacts
    primary_person_name             VARCHAR(100),
    primary_person_email            VARCHAR(150),
    primary_person_phone_1          VARCHAR(20),
    primary_person_phone_2          VARCHAR(20),
    secondary_person_name           VARCHAR(100),
    secondary_person_email          VARCHAR(150),
    secondary_person_phone_1        VARCHAR(20),
    secondary_person_phone_2        VARCHAR(20),

    -- Address
    address_line_1                  TEXT,
    address_line_2                  TEXT,
    landmark                        VARCHAR(150),
    city                            VARCHAR(100),
    district                        VARCHAR(100),
    state                           VARCHAR(100),
    pin_code                        VARCHAR(10),

    -- Professional Information
    employment_type                 VARCHAR(50),
    employee_id                     VARCHAR(50),
    safety_training_completion      VARCHAR(10),
    safety_training_completion_date DATE,
    medical_fitness                 VARCHAR(10),
    medical_fitness_exp_date        DATE,
    driving_experience              INT,
    police_verification             VARCHAR(10),
    police_verification_date        DATE,

    -- Bank Details
    bank_name                       VARCHAR(100),
    account_holder_name             VARCHAR(150),
    account_number                  VARCHAR(50),
    ifsc_code                       VARCHAR(20),

    -- Tracking & Assignment
    beacon_id                       VARCHAR(100),
    vehicle                         VARCHAR(100),

    -- Documents
    driving_license                 TEXT,
    aadhaar_card                    TEXT,
    pan_card                        TEXT,
    police_verification_doc         TEXT,
    medical_fitness_certificate     TEXT,
    address_proof_doc               TEXT,
    training_certificate_doc        TEXT,

    -- Status
    status                          VARCHAR(20) DEFAULT 'active',
    remarks                         TEXT,

    created_at                      TIMESTAMPTZ DEFAULT NOW(),
    updated_at                      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schema1.institute_driver_license_insurance (
    id              SERIAL PRIMARY KEY,
    driver_id       INT NOT NULL REFERENCES schema1.institute_drivers(id) ON DELETE CASCADE,
    type            VARCHAR(50),
    number          VARCHAR(50),
    issue_date      DATE,
    exp_date        DATE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes for performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_institute_roles_org        ON schema1.institute_roles(org_id);
CREATE INDEX IF NOT EXISTS idx_institute_employees_org    ON schema1.institute_employees(org_id);
CREATE INDEX IF NOT EXISTS idx_institute_employees_status ON schema1.institute_employees(status);
CREATE INDEX IF NOT EXISTS idx_institute_vehicles_org     ON schema1.institute_vehicles(org_id);
CREATE INDEX IF NOT EXISTS idx_institute_vehicles_status  ON schema1.institute_vehicles(status);
CREATE INDEX IF NOT EXISTS idx_institute_drivers_org      ON schema1.institute_drivers(org_id);
CREATE INDEX IF NOT EXISTS idx_institute_drivers_status   ON schema1.institute_drivers(status);
