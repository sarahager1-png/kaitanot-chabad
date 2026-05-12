-- ============================================================
-- MIGRATION FIX 2 — תיקונים נוספים
-- הרץ ב-Supabase SQL Editor לאחר migration_security.sql
-- ============================================================

-- ============================================================
-- 1. טבלת allowed_emails — רשימת מורשים לכניסה
-- ============================================================
create table if not exists allowed_emails (
  email      text primary key,
  full_name  text,
  role       text not null default 'שליח'
               check (role in ('שליח', 'מנהל קייטנה', 'מנהל רשת', 'מנהל מערכת', 'אדמין מערכת')),
  created_at timestamptz default now()
);
alter table allowed_emails enable row level security;
-- רק admins יכולים לקרוא/לכתוב
create policy "allowed_emails admin only" on allowed_emails for all using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('מנהל רשת', 'מנהל מערכת', 'אדמין מערכת')
  )
);

-- ============================================================
-- 2. הוספת האדמין הראשי
-- ============================================================
insert into allowed_emails (email, full_name, role)
values ('bina@reshetch.org.il', 'בינה', 'אדמין מערכת')
on conflict (email) do update
  set role = 'אדמין מערכת';

-- גם אם פרופיל קיים — עדכן ל-אדמין מערכת
update profiles
set role = 'אדמין מערכת'
where id in (
  select au.id from auth.users au
  where au.email = 'bina@reshetch.org.il'
);

-- ============================================================
-- 3. תיקון role constraint — הוספת 'מנהל מערכת' (חסר ב-migration_security.sql)
-- ============================================================
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('שליח', 'מנהל קייטנה', 'מנהל רשת', 'מנהל מערכת', 'אדמין מערכת'));

-- ============================================================
-- 4. תיקון RLS — tracks (select פתוח מדי)
-- ============================================================
drop policy if exists "tracks select" on tracks;
create policy "tracks select" on tracks for select using (
  exists (
    select 1 from camp_users cu
    join profiles p on p.id = auth.uid()
    where cu.camp_id = tracks.camp_id
      and (cu.user_id = auth.uid() or p.role in ('מנהל רשת', 'מנהל מערכת', 'אדמין מערכת'))
  )
);

-- ============================================================
-- 5. תיקון RLS — camp_users (אם לא הופעל migration_security.sql)
-- ============================================================
drop policy if exists "camp_users select" on camp_users;
create policy "camp_users select" on camp_users for select using (
  user_id = auth.uid()
  or exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('מנהל רשת', 'מנהל מערכת', 'אדמין מערכת')
  )
);

-- ============================================================
-- 6. תיקון RLS — activities (אם לא הופעל migration_security.sql)
-- ============================================================
drop policy if exists "activities all" on activities;
drop policy if exists "activities by camp" on activities;
create policy "activities by camp" on activities for all using (
  exists (
    select 1 from daily_plans dp
    join camp_users cu on cu.camp_id = dp.camp_id
    join profiles p on p.id = auth.uid()
    where dp.id = activities.plan_id
      and (cu.user_id = auth.uid() or p.role in ('מנהל רשת', 'מנהל מערכת', 'אדמין מערכת'))
  )
);

-- ============================================================
-- 7. תיקון RLS — plan_files (אם לא הופעל migration_security.sql)
-- ============================================================
drop policy if exists "plan_files all" on plan_files;
drop policy if exists "plan_files by camp" on plan_files;
create policy "plan_files by camp" on plan_files for all using (
  exists (
    select 1 from camp_users cu
    join profiles p on p.id = auth.uid()
    where cu.camp_id = plan_files.camp_id
      and (cu.user_id = auth.uid() or p.role in ('מנהל רשת', 'מנהל מערכת', 'אדמין מערכת'))
  )
);

-- ============================================================
-- 8. תיקון profiles — admins יכולים לראות כל פרופיל
-- ============================================================
drop policy if exists "admin sees all profiles" on profiles;
create policy "admin sees all profiles" on profiles for all using (
  exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('מנהל רשת', 'מנהל מערכת', 'אדמין מערכת')
  )
);

-- ============================================================
-- סיום — הרץ migration זה ב-SQL Editor של Supabase
-- ============================================================
