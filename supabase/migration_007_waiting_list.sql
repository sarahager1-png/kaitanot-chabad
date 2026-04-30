-- Migration 007: waiting list flag on registrants
ALTER TABLE registrants ADD COLUMN IF NOT EXISTS is_waiting boolean DEFAULT false;
