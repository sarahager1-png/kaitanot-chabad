-- ============================================================
-- MIGRATION: תיקוני אבטחה
-- הרץ ב-Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. תיקון RLS — camp_users
-- מ-"כל אחד יכול לראות הכל" לגישה מוגבלת
-- ============================================================
drop policy if exists "camp_users select" on camp_users;
create policy "camp_users select" on camp_users for select using (
  user_id = auth.uid()
  or exists (
    select 1 from profiles p
    where p.id = auth.uid()
      and p.role in ('מנהל רשת', 'אדמין מערכת')
  )
);

-- ============================================================
-- 2. תיקון RLS — activities
-- מ-"using (true)" לגישה לפי קייטנה
-- ============================================================
drop policy if exists "activities all" on activities;
create policy "activities by camp" on activities for all using (
  exists (
    select 1 from daily_plans dp
    join camp_users cu on cu.camp_id = dp.camp_id
    join profiles p on p.id = auth.uid()
    where dp.id = activities.plan_id
      and (cu.user_id = auth.uid() or p.role in ('מנהל רשת', 'אדמין מערכת'))
  )
);

-- ============================================================
-- 3. תיקון RLS — plan_files
-- מ-"using (true)" לגישה לפי קייטנה
-- ============================================================
drop policy if exists "plan_files all" on plan_files;
create policy "plan_files by camp" on plan_files for all using (
  exists (
    select 1 from camp_users cu
    join profiles p on p.id = auth.uid()
    where cu.camp_id = plan_files.camp_id
      and (cu.user_id = auth.uid() or p.role in ('מנהל רשת', 'אדמין מערכת'))
  )
);

-- ============================================================
-- 3b. תיקון role CHECK — הוספת 'מנהל קייטנה' (מתואם עם lib/types.ts)
-- ============================================================
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'));

-- ============================================================
-- 4. תיקון trigger יצירת פרופיל — ולידציית role
-- מניעת הזרקת תפקיד שרירותי דרך metadata
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  v_role text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'שליח');
  -- ולידציה — אם התפקיד לא חוקי, ברירת מחדל ל-שליח
  if v_role not in ('שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת') then
    v_role := 'שליח';
  end if;
  insert into profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    v_role
  );
  return new;
end;
$$;

-- ============================================================
-- 5. הוספת עמודות Cardcom לטבלת camps (אם לא קיימות)
-- ============================================================
alter table camps
  add column if not exists cardcom_terminal     text,
  add column if not exists cardcom_api_name     text,
  add column if not exists cardcom_api_password text,
  add column if not exists phone                text,
  add column if not exists updated_at           timestamptz default now();

-- ============================================================
-- 6. הוספת שדות חסרים ב-registrants (אם לא קיימים)
-- ============================================================
alter table registrants
  add column if not exists primary_phone              text,
  add column if not exists emergency_contact_name     text,
  add column if not exists emergency_contact_phone    text,
  add column if not exists is_healthy                 boolean default true,
  add column if not exists health_issues              text,
  add column if not exists allergies                  text,
  add column if not exists medications                text,
  add column if not exists updated_at                 timestamptz default now();

-- ============================================================
-- 7. טבלת TRIPS (טיולים)
-- ============================================================
create table if not exists trips (
  id          uuid primary key default gen_random_uuid(),
  camp_id     uuid not null references camps(id) on delete cascade,
  title       text not null,
  trip_date   date,
  destination text,
  notes       text,
  created_by  uuid references profiles(id),
  created_at  timestamptz default now()
);
alter table trips enable row level security;
create policy "trips by camp" on trips for all using (
  exists (
    select 1 from camp_users cu
    join profiles p on p.id = auth.uid()
    where cu.camp_id = trips.camp_id
      and (cu.user_id = auth.uid() or p.role in ('מנהל רשת', 'אדמין מערכת'))
  )
);

-- ============================================================
-- 7b. הוספת provider_ref ל-income_entries — נדרש ל-idempotency ב-webhook
-- ============================================================
alter table income_entries add column if not exists provider_ref text;
create index if not exists income_entries_provider_ref_idx on income_entries(provider_ref) where provider_ref is not null;

-- ============================================================
-- 8. טבלת TRIP_APPROVALS (אישורי הורים לטיולים)
-- הטוקן הוא UUID שנוצר אוטומטית — קשה לנחש
-- ============================================================
create table if not exists trip_approvals (
  id             uuid primary key default gen_random_uuid(),
  trip_id        uuid not null references trips(id) on delete cascade,
  registrant_id  uuid not null references registrants(id) on delete cascade,
  camp_id        uuid not null references camps(id) on delete cascade,
  token          uuid not null default gen_random_uuid() unique,
  signed         boolean default false,
  signed_at      timestamptz,
  signer_name    text,
  signature_data text,
  created_at     timestamptz default now(),
  unique(trip_id, registrant_id)
);
alter table trip_approvals enable row level security;
-- מנהלי קייטנה רואים לפי camp דרך trips
create policy "trip_approvals by camp" on trip_approvals for all using (
  exists (
    select 1 from trips t
    join camp_users cu on cu.camp_id = t.camp_id
    join profiles p on p.id = auth.uid()
    where t.id = trip_approvals.trip_id
      and (cu.user_id = auth.uid() or p.role in ('מנהל רשת', 'אדמין מערכת'))
  )
);
-- גישה ציבורית לפי טוקן — API route בלבד (service client)
-- אין policy ציבורית — כל גישה ציבורית נעשית דרך service role

-- ============================================================
-- 9. טבלת TRIP_FILES (קבצים לטיולים)
-- ============================================================
create table if not exists trip_files (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references trips(id) on delete cascade,
  camp_id    uuid not null references camps(id) on delete cascade,
  file_name  text not null,
  file_url   text not null,
  file_size  bigint,
  created_at timestamptz default now()
);
alter table trip_files enable row level security;
create policy "trip_files by camp" on trip_files for all using (
  exists (
    select 1 from camp_users cu
    join profiles p on p.id = auth.uid()
    where cu.camp_id = trip_files.camp_id
      and (cu.user_id = auth.uid() or p.role in ('מנהל רשת', 'אדמין מערכת'))
  )
);

-- ============================================================
-- 10. Storage policies לטיולים
-- ============================================================
create policy "trip files upload" on storage.objects for insert
  with check (
    bucket_id = 'camp-documents'
    and auth.uid() is not null
  );

create policy "trip files read" on storage.objects for select
  using (
    bucket_id = 'camp-documents'
    and auth.uid() is not null
  );

-- ============================================================
-- סיום — הרץ והאפלקציה מאובטחת
-- ============================================================
