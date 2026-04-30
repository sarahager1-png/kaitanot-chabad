-- Migration 005: add health fields and emergency contact to registrants
ALTER TABLE registrants
  ADD COLUMN IF NOT EXISTS emergency_contact_name  text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS is_healthy              boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS health_issues           text,
  ADD COLUMN IF NOT EXISTS allergies               text,
  ADD COLUMN IF NOT EXISTS medications             text;
