-- Migration 002: trips approvals + shared content library + activity vendors
-- Run this in Supabase SQL Editor

-- ============================================================
-- TRIPS (טיולים)
-- ============================================================
CREATE TABLE IF NOT EXISTS trips (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id     uuid NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text,
  trip_date   date,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trips' AND policyname='trips by camp') THEN
    CREATE POLICY "trips by camp" ON trips FOR ALL USING (
      EXISTS (
        SELECT 1 FROM camp_users cu JOIN profiles p ON p.id = auth.uid()
        WHERE (cu.camp_id = trips.camp_id AND cu.user_id = auth.uid())
           OR p.role IN ('מנהל רשת','אדמין מערכת')
      )
    );
  END IF;
END $$;

-- ============================================================
-- TRIP_APPROVALS (אישורי טיול)
-- ============================================================
CREATE TABLE IF NOT EXISTS trip_approvals (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id       uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  registrant_id uuid NOT NULL REFERENCES registrants(id) ON DELETE CASCADE,
  camp_id       uuid NOT NULL REFERENCES camps(id),
  token         text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  signed        boolean DEFAULT false,
  signed_at     timestamptz,
  signer_name   text,
  signature_data text,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(trip_id, registrant_id)
);
ALTER TABLE trip_approvals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='trip_approvals' AND policyname='approvals by camp') THEN
    CREATE POLICY "approvals by camp" ON trip_approvals FOR ALL USING (
      EXISTS (
        SELECT 1 FROM camp_users cu JOIN profiles p ON p.id = auth.uid()
        WHERE (cu.camp_id = trip_approvals.camp_id AND cu.user_id = auth.uid())
           OR p.role IN ('מנהל רשת','אדמין מערכת')
      )
    );
  END IF;
END $$;

-- ============================================================
-- SHARED CONTENT (ספריית תכנים משותפת)
-- ============================================================
CREATE TABLE IF NOT EXISTS shared_content (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid REFERENCES profiles(id),
  camp_id     uuid REFERENCES camps(id),
  title       text NOT NULL,
  description text,
  category    text DEFAULT 'אחר',
  file_url    text,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE shared_content ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shared_content' AND policyname='shared read') THEN
    CREATE POLICY "shared read" ON shared_content FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shared_content' AND policyname='shared insert') THEN
    CREATE POLICY "shared insert" ON shared_content FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shared_content' AND policyname='shared delete own') THEN
    CREATE POLICY "shared delete own" ON shared_content FOR DELETE USING (uploaded_by = auth.uid());
  END IF;
END $$;

-- ============================================================
-- ACTIVITY VENDORS (ספקי פעילויות)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_vendors (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  activity    text NOT NULL,
  phone       text,
  website     text,
  notes       text,
  created_by  uuid REFERENCES profiles(id),
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE activity_vendors ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activity_vendors' AND policyname='av read') THEN
    CREATE POLICY "av read" ON activity_vendors FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='activity_vendors' AND policyname='av manage') THEN
    CREATE POLICY "av manage" ON activity_vendors FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('מנהל רשת','אדמין מערכת'))
    );
  END IF;
END $$;

-- ============================================================
-- VENDOR REVIEWS (דירוגים וחוות דעת)
-- ============================================================
CREATE TABLE IF NOT EXISTS vendor_reviews (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id   uuid NOT NULL REFERENCES activity_vendors(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES profiles(id),
  camp_id     uuid REFERENCES camps(id),
  stars       int NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment     text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(vendor_id, reviewer_id)
);
ALTER TABLE vendor_reviews ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_reviews' AND policyname='reviews read') THEN
    CREATE POLICY "reviews read" ON vendor_reviews FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_reviews' AND policyname='reviews write') THEN
    CREATE POLICY "reviews write" ON vendor_reviews FOR INSERT WITH CHECK (reviewer_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vendor_reviews' AND policyname='reviews update own') THEN
    CREATE POLICY "reviews update own" ON vendor_reviews FOR UPDATE USING (reviewer_id = auth.uid());
  END IF;
END $$;
