-- Migration 009: Fix ALLOW TRUE RLS policies on activities and plan_files

-- activities: was using (true), now requires camp membership via daily_plans
DROP POLICY IF EXISTS "activities all" ON activities;
CREATE POLICY "activities by camp" ON activities FOR ALL USING (
  EXISTS (
    SELECT 1 FROM daily_plans dp
    JOIN profiles p ON p.id = auth.uid()
    LEFT JOIN camp_users cu ON cu.camp_id = dp.camp_id AND cu.user_id = auth.uid()
    WHERE dp.id = activities.plan_id
    AND (cu.camp_id IS NOT NULL OR p.role IN ('מנהל רשת','אדמין מערכת'))
  )
);

-- plan_files: was using (true), now uses camp_id column directly
DROP POLICY IF EXISTS "plan_files all" ON plan_files;
CREATE POLICY "plan_files by camp" ON plan_files FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles p
    LEFT JOIN camp_users cu ON cu.camp_id = plan_files.camp_id AND cu.user_id = auth.uid()
    WHERE p.id = auth.uid()
    AND (cu.camp_id IS NOT NULL OR p.role IN ('מנהל רשת','אדמין מערכת'))
  )
);
