-- Migration 008: daily attendance tracking
CREATE TABLE IF NOT EXISTS attendance (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  registrant_id uuid NOT NULL REFERENCES registrants(id) ON DELETE CASCADE,
  camp_id       uuid NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  date          date NOT NULL,
  present       boolean NOT NULL DEFAULT true,
  notes         text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(registrant_id, date)
);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='attendance' AND policyname='attendance by camp') THEN
    CREATE POLICY "attendance by camp" ON attendance FOR ALL USING (
      EXISTS (
        SELECT 1 FROM camp_users cu JOIN profiles p ON p.id = auth.uid()
        WHERE (cu.camp_id = attendance.camp_id AND cu.user_id = auth.uid())
           OR p.role IN ('מנהל רשת','אדמין מערכת')
      )
    );
  END IF;
END $$;
