-- Migration 006: primary_phone — the phone used for sending approvals/messages
ALTER TABLE registrants ADD COLUMN IF NOT EXISTS primary_phone text;
