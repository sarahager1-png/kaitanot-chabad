-- Migration 003: add signature_data to trip_approvals
-- Run only if migration_002 was already executed without the signature_data column
ALTER TABLE trip_approvals ADD COLUMN IF NOT EXISTS signature_data text;
