-- הרץ את הסקריפט הזה ב-Supabase SQL Editor
-- https://supabase.com/dashboard/project/_/sql

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  type text not null,
  topic text,
  attendees text,
  meeting_date date,
  transcript text,
  summary text,
  conclusions text,
  decisions text,
  work_plan text,
  status text default 'recording'
);

-- אם הטבלה כבר קיימת, הוסף את העמודות החסרות:
-- alter table sessions add column if not exists topic text;
-- alter table sessions add column if not exists attendees text;
-- alter table sessions add column if not exists meeting_date date;
-- alter table sessions add column if not exists decisions text;

-- מאפשר גישה ציבורית (ללא Auth) — אפשר להגביל בהמשך
alter table sessions enable row level security;
create policy "allow all" on sessions for all using (true);
