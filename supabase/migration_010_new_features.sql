-- ============================================================
-- MIGRATION 010 — טבלאות חדשות: משכורות, שוברים, בקשות, הסכמים, מענקים
-- הרץ ב-Supabase SQL Editor
-- כל הפקודות idempotent — בטוח להריץ כמה פעמים
-- ============================================================

-- ============================================================
-- 1. EMPLOYEES (עובדים לניהול משכורות)
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id        uuid NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  name           text NOT NULL,
  role           text,
  monthly_salary numeric(10,2) NOT NULL DEFAULT 0,
  notes          text,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='employees' AND policyname='employees by camp') THEN
    CREATE POLICY "employees by camp" ON employees FOR ALL USING (
      EXISTS (
        SELECT 1 FROM camp_users cu JOIN profiles p ON p.id = auth.uid()
        WHERE (cu.camp_id = employees.camp_id AND cu.user_id = auth.uid())
           OR p.role IN ('מנהל רשת','אדמין מערכת')
      )
    );
  END IF;
END $$;

-- ============================================================
-- 2. SALARY_PAYMENTS (תשלומי משכורת)
-- ============================================================
CREATE TABLE IF NOT EXISTS salary_payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id     uuid NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month       date NOT NULL,
  amount      numeric(10,2) NOT NULL DEFAULT 0,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid')),
  receipt_url text,
  notes       text,
  paid_at     timestamptz,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(employee_id, month)
);
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='salary_payments' AND policyname='salary_payments by camp') THEN
    CREATE POLICY "salary_payments by camp" ON salary_payments FOR ALL USING (
      EXISTS (
        SELECT 1 FROM camp_users cu JOIN profiles p ON p.id = auth.uid()
        WHERE (cu.camp_id = salary_payments.camp_id AND cu.user_id = auth.uid())
           OR p.role IN ('מנהל רשת','אדמין מערכת')
      )
    );
  END IF;
END $$;

-- ============================================================
-- 3. VOUCHER_TYPES (סוגי שוברים — מנוהל ע"י אדמין)
-- ============================================================
CREATE TABLE IF NOT EXISTS voucher_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  price       numeric(10,2),
  emoji       text NOT NULL DEFAULT '🎁',
  expiry_date text,
  audience    text NOT NULL DEFAULT 'הכל' CHECK (audience IN ('חניכים','צוות','הכל')),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE voucher_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='voucher_types' AND policyname='voucher_types read') THEN
    CREATE POLICY "voucher_types read" ON voucher_types FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='voucher_types' AND policyname='voucher_types admin') THEN
    CREATE POLICY "voucher_types admin" ON voucher_types FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('מנהל רשת','אדמין מערכת'))
    );
  END IF;
END $$;

-- ============================================================
-- 4. PAYMENT_REQUESTS (בקשות תשלום מהקייטנה לרשת)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  camp_id     uuid NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
  name        text NOT NULL,
  amount      numeric(10,2) NOT NULL DEFAULT 0,
  category    text,
  notes       text,
  status      text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','in_progress','paid','completed')),
  receipt_url text,
  paid_at     timestamptz,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE payment_requests ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='payment_requests' AND policyname='payment_requests by camp') THEN
    CREATE POLICY "payment_requests by camp" ON payment_requests FOR ALL USING (
      EXISTS (
        SELECT 1 FROM camp_users cu JOIN profiles p ON p.id = auth.uid()
        WHERE (cu.camp_id = payment_requests.camp_id AND cu.user_id = auth.uid())
           OR p.role IN ('מנהל רשת','אדמין מערכת')
      )
    );
  END IF;
END $$;

-- ============================================================
-- 5. SIGNED_AGREEMENTS (הסכמים חתומים שהתקבלו)
-- ============================================================
CREATE TABLE IF NOT EXISTS signed_agreements (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_type text NOT NULL CHECK (agreement_type IN ('camp-contract','direct-operation')),
  city           text,
  emissary       text,
  camp_year      text,
  sign_day       text,
  sign_place     text,
  signature_data text,
  created_at     timestamptz DEFAULT now()
);
ALTER TABLE signed_agreements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='signed_agreements' AND policyname='signed_agreements admin') THEN
    CREATE POLICY "signed_agreements admin" ON signed_agreements FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('מנהל רשת','אדמין מערכת'))
    );
  END IF;
  -- כתיבה פתוחה — שליח חותם על הסכם ושולח (INSERT בלבד)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='signed_agreements' AND policyname='signed_agreements insert') THEN
    CREATE POLICY "signed_agreements insert" ON signed_agreements FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- ============================================================
-- 6. GRANT_TYPES (סוגי מענקי פעילות — מנוהל ע"י אדמין)
-- ============================================================
CREATE TABLE IF NOT EXISTS grant_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  amount      numeric(10,2),
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE grant_types ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='grant_types' AND policyname='grant_types read') THEN
    CREATE POLICY "grant_types read" ON grant_types FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='grant_types' AND policyname='grant_types admin') THEN
    CREATE POLICY "grant_types admin" ON grant_types FOR ALL USING (
      EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('מנהל רשת','אדמין מערכת'))
    );
  END IF;
END $$;

-- ============================================================
-- 7. עדכון budgets — הוספת budget_type (קבועה / לילד)
-- ============================================================
ALTER TABLE budgets ADD COLUMN IF NOT EXISTS budget_type text
  CHECK (budget_type IN ('קבועה','לילד'));

-- ============================================================
-- 8. עדכון registrants — הוספת age (אם חסר)
-- ============================================================
ALTER TABLE registrants ADD COLUMN IF NOT EXISTS age integer;

-- ============================================================
-- 9. network_settings — ערכי ברירת מחדל לחתימת הרב
-- ============================================================
INSERT INTO network_settings (key, value)
VALUES ('rabbi_signature_data', '')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- סיום
-- הרץ migration זה ב-SQL Editor של Supabase פעם אחת.
-- כל הפקודות בטוחות לריצה חוזרת (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- ============================================================
