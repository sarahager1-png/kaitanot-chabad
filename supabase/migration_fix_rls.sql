-- ============================================================
-- תיקון RLS: tracks, activities, plan_files
-- הרץ בעורך ה-SQL של Supabase
-- ============================================================

-- ── tracks ──────────────────────────────────────────────────
-- לפני: for select using (true) — כל משתמש ראה מסלולי כל הקייטנות
-- אחרי: מוגבל לקייטנות המשויכות למשתמש

DROP POLICY IF EXISTS "tracks select" ON tracks;
DROP POLICY IF EXISTS "tracks manage" ON tracks;

CREATE POLICY "tracks by camp" ON tracks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM camp_users cu
    JOIN profiles p ON p.id = auth.uid()
    WHERE (cu.camp_id = tracks.camp_id AND cu.user_id = auth.uid())
       OR p.role IN ('מנהל רשת', 'אדמין מערכת')
  )
);

-- ── activities ───────────────────────────────────────────────
-- לפני: for all using (true) — כולם ראו ועדכנו פעילויות של כולם
-- אחרי: מוגבל דרך daily_plans.camp_id

DROP POLICY IF EXISTS "activities all" ON activities;

CREATE POLICY "activities by camp" ON activities FOR ALL USING (
  EXISTS (
    SELECT 1 FROM daily_plans dp
    JOIN camp_users cu ON cu.camp_id = dp.camp_id
    JOIN profiles p ON p.id = auth.uid()
    WHERE dp.id = activities.plan_id
      AND (cu.user_id = auth.uid() OR p.role IN ('מנהל רשת', 'אדמין מערכת'))
  )
);

-- ── plan_files ───────────────────────────────────────────────
-- לפני: for all using (true) — כולם ראו קבצי תכנון של כולם
-- אחרי: מוגבל לפי camp_id ישיר בטבלה

DROP POLICY IF EXISTS "plan_files all" ON plan_files;

CREATE POLICY "plan_files by camp" ON plan_files FOR ALL USING (
  EXISTS (
    SELECT 1 FROM camp_users cu
    JOIN profiles p ON p.id = auth.uid()
    WHERE (cu.camp_id = plan_files.camp_id AND cu.user_id = auth.uid())
       OR p.role IN ('מנהל רשת', 'אדמין מערכת')
  )
);
