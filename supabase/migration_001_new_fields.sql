-- Migration 001: new fields for registrants, expense_entries, vendors table
-- Run this in Supabase SQL Editor

-- Registrants: new fields
ALTER TABLE registrants
  ADD COLUMN IF NOT EXISTS gender        text CHECK (gender IN ('זכר','נקבה')),
  ADD COLUMN IF NOT EXISTS photo_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS shirt_size    text,
  ADD COLUMN IF NOT EXISTS kippah_size   text;

-- Expense entries: payment status + invoice
ALTER TABLE expense_entries
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'לא שולם' CHECK (payment_status IN ('שולם','לא שולם')),
  ADD COLUMN IF NOT EXISTS invoice_url    text;

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendors' AND policyname='vendors read') THEN
    CREATE POLICY "vendors read" ON vendors FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendors' AND policyname='vendors manage') THEN
    CREATE POLICY "vendors manage" ON vendors FOR ALL USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
