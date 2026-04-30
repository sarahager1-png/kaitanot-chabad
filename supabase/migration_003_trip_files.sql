-- Migration 003: trip_files — documents/forms attached to a trip
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS trip_files (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id      uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  camp_id      uuid NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  file_name    text NOT NULL,
  file_url     text NOT NULL,
  file_size    bigint,
  uploaded_by  uuid REFERENCES profiles(id),
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE trip_files ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trip_files' AND policyname='trip_files by camp') THEN
    CREATE POLICY "trip_files by camp" ON trip_files FOR ALL USING (
      EXISTS (
        SELECT 1 FROM camp_users cu JOIN profiles p ON p.id = auth.uid()
        WHERE (cu.camp_id = trip_files.camp_id AND cu.user_id = auth.uid())
           OR p.role IN ('מנהל רשת','אדמין מערכת')
      )
    );
  END IF;
END $$;
