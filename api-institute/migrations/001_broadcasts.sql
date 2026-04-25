-- Migration: Create Bulk Communication Tables
-- Schema: schema1

-- 1. Table for storing the broadcast messages
CREATE TABLE IF NOT EXISTS schema1.institute_broadcasts (
  id              SERIAL PRIMARY KEY,
  org_id          INTEGER NOT NULL,
  target_audience VARCHAR(50) NOT NULL,         -- 'everyone', 'staff', 'drivers'
  channel         VARCHAR(10) NOT NULL,          -- 'email', 'sms', 'push'
  subject         VARCHAR(255) NOT NULL,
  body            TEXT NOT NULL,
  attachment_url  TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'sent',  -- 'draft', 'scheduled', 'sending', 'sent', 'failed'
  scheduled_at    TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  total_recipients INTEGER DEFAULT 0,
  delivered_count  INTEGER DEFAULT 0,
  opened_count     INTEGER DEFAULT 0,
  created_by      INTEGER,                       -- Admin/Employee ID who sent it
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_org ON schema1.institute_broadcasts(org_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON schema1.institute_broadcasts(status);

-- 2. Table for tracking individual recipient delivery
CREATE TABLE IF NOT EXISTS schema1.institute_broadcast_recipients (
  id              SERIAL PRIMARY KEY,
  broadcast_id    INTEGER NOT NULL REFERENCES schema1.institute_broadcasts(id) ON DELETE CASCADE,
  recipient_type  VARCHAR(20) NOT NULL,          -- 'employee', 'driver'
  recipient_id    INTEGER NOT NULL,
  recipient_name  VARCHAR(255),
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(20),
  status          VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'opened'
  sent_at         TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_br_broadcast ON schema1.institute_broadcast_recipients(broadcast_id);
