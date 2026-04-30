-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  role         text not null default 'שליח' check (role in ('שליח','מנהל רשת','אדמין מערכת')),
  phone        text,
  created_at   timestamptz default now()
);
alter table profiles enable row level security;
create policy "users see own profile" on profiles for select using (auth.uid() = id);
create policy "users update own profile" on profiles for update using (auth.uid() = id);
create policy "admin sees all profiles" on profiles for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'אדמין מערכת')
);

-- ============================================================
-- CAMPS (קייטנות)
-- ============================================================
create table if not exists camps (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  school_year           text not null default 'תשפ״ה',
  address               text,
  registration_open_at  date,
  registration_close_at date,
  camp_open_at          date,
  camp_close_at         date,
  registration_goal     integer default 0,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);
alter table camps enable row level security;
create policy "camp access" on camps for all using (
  exists (
    select 1 from camp_users cu
    join profiles p on p.id = auth.uid()
    where (cu.camp_id = camps.id and cu.user_id = auth.uid())
       or p.role in ('מנהל רשת','אדמין מערכת')
  )
);

-- ============================================================
-- CAMP_USERS (שיוך שליח לקייטנה)
-- ============================================================
create table if not exists camp_users (
  id        uuid primary key default gen_random_uuid(),
  camp_id   uuid not null references camps(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  unique(camp_id, user_id)
);
alter table camp_users enable row level security;
create policy "camp_users select" on camp_users for select using (true);
create policy "camp_users manage" on camp_users for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role in ('מנהל רשת','אדמין מערכת'))
);

-- ============================================================
-- TRACKS (מסלולים לכל קייטנה)
-- ============================================================
create table if not exists tracks (
  id          uuid primary key default gen_random_uuid(),
  camp_id     uuid not null references camps(id) on delete cascade,
  name        text not null,
  description text,
  price       numeric(10,2) default 0,
  created_at  timestamptz default now()
);
alter table tracks enable row level security;
create policy "tracks select" on tracks for select using (true);
create policy "tracks manage" on tracks for all using (
  exists (
    select 1 from camp_users cu join profiles p on p.id = auth.uid()
    where (cu.camp_id = tracks.camp_id and cu.user_id = auth.uid())
       or p.role in ('מנהל רשת','אדמין מערכת')
  )
);

-- ============================================================
-- REGISTRANTS (ילדים רשומים)
-- ============================================================
create table if not exists registrants (
  id               uuid primary key default gen_random_uuid(),
  camp_id          uuid not null references camps(id) on delete cascade,
  track_id         uuid references tracks(id),
  first_name       text not null,
  last_name        text not null,
  birth_date       date,
  group_name       text,
  parent1_name     text,
  parent1_phone    text,
  parent2_name     text,
  parent2_phone    text,
  email            text,
  payment_status   text default 'טרם שולם'
                     check (payment_status in ('טרם שולם','שולם חלקי','שולם מלא')),
  amount_paid      numeric(10,2) default 0,
  amount_due       numeric(10,2) default 0,
  notes            text,
  gender           text check (gender in ('זכר','נקבה')),
  photo_consent    boolean default false,
  shirt_size       text,
  kippah_size      text,
  created_at       timestamptz default now()
);
alter table registrants enable row level security;
create policy "registrants by camp" on registrants for all using (
  exists (
    select 1 from camp_users cu
    join profiles p on p.id = auth.uid()
    where (cu.camp_id = registrants.camp_id and cu.user_id = auth.uid())
       or p.role in ('מנהל רשת','אדמין מערכת')
  )
);

-- ============================================================
-- INCOME (הכנסות)
-- ============================================================
create table if not exists income_entries (
  id          uuid primary key default gen_random_uuid(),
  camp_id     uuid not null references camps(id) on delete cascade,
  category    text not null,
  description text,
  amount      numeric(10,2) not null,
  entry_date  date default current_date,
  created_at  timestamptz default now()
);
alter table income_entries enable row level security;
create policy "income by camp" on income_entries for all using (
  exists (
    select 1 from camp_users cu join profiles p on p.id = auth.uid()
    where (cu.camp_id = income_entries.camp_id and cu.user_id = auth.uid())
       or p.role in ('מנהל רשת','אדמין מערכת')
  )
);

-- ============================================================
-- EXPENSES (הוצאות)
-- ============================================================
create table if not exists expense_entries (
  id           uuid primary key default gen_random_uuid(),
  camp_id      uuid not null references camps(id) on delete cascade,
  category     text not null,
  description  text,
  amount       numeric(10,2) not null,
  vendor         text,
  payment_status text default 'לא שולם' check (payment_status in ('שולם','לא שולם')),
  invoice_url    text,
  entry_date     date default current_date,
  created_at     timestamptz default now()
);
alter table expense_entries enable row level security;
create policy "expenses by camp" on expense_entries for all using (
  exists (
    select 1 from camp_users cu join profiles p on p.id = auth.uid()
    where (cu.camp_id = expense_entries.camp_id and cu.user_id = auth.uid())
       or p.role in ('מנהל רשת','אדמין מערכת')
  )
);

-- ============================================================
-- BUDGETS (תקציב מתוכנן)
-- ============================================================
create table if not exists budgets (
  id               uuid primary key default gen_random_uuid(),
  camp_id          uuid not null references camps(id) on delete cascade,
  category         text not null,
  planned_amount   numeric(10,2) not null default 0,
  alert_threshold  numeric(3,2) default 0.9,
  unique(camp_id, category)
);
alter table budgets enable row level security;
create policy "budgets by camp" on budgets for all using (
  exists (
    select 1 from camp_users cu join profiles p on p.id = auth.uid()
    where (cu.camp_id = budgets.camp_id and cu.user_id = auth.uid())
       or p.role in ('מנהל רשת','אדמין מערכת')
  )
);

-- ============================================================
-- NETWORK SERVICES (שירותי רשת — מנוהל ע"י אדמין)
-- ============================================================
create table if not exists network_services (
  id              uuid primary key default gen_random_uuid(),
  category        text not null
                    check (category in ('אוזניות','סובלימציה','קצף','ערכות לילדים','אביזרים')),
  name            text not null,
  description     text,
  price_per_unit  numeric(10,2),
  price_per_child numeric(10,2),
  unit_label      text default 'יח׳',
  is_active       boolean default true,
  created_at      timestamptz default now()
);
alter table network_services enable row level security;
create policy "services read all" on network_services for select using (true);
create policy "services write admin" on network_services for all using (
  exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'אדמין מערכת')
);

-- ============================================================
-- ORDERS (הזמנות שירותי רשת)
-- ============================================================
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  camp_id       uuid not null references camps(id) on delete cascade,
  service_id    uuid not null references network_services(id),
  quantity      integer not null default 1,
  delivery_date date,
  notes         text,
  status        text default 'ממתין לאישור'
                  check (status in ('ממתין לאישור','מאושר','בוצע')),
  ordered_by    uuid references profiles(id),
  approved_by   uuid references profiles(id),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);
alter table orders enable row level security;
create policy "orders by camp" on orders for all using (
  exists (
    select 1 from camp_users cu join profiles p on p.id = auth.uid()
    where (cu.camp_id = orders.camp_id and cu.user_id = auth.uid())
       or p.role in ('מנהל רשת','אדמין מערכת')
  )
);

-- ============================================================
-- DOCUMENTS (מסמכים ורישוי)
-- ============================================================
create table if not exists documents (
  id           uuid primary key default gen_random_uuid(),
  camp_id      uuid not null references camps(id) on delete cascade,
  doc_type     text not null,
  label        text not null,
  file_url     text,
  is_completed boolean default false,
  due_date     date,
  created_at   timestamptz default now()
);
alter table documents enable row level security;
create policy "documents by camp" on documents for all using (
  exists (
    select 1 from camp_users cu join profiles p on p.id = auth.uid()
    where (cu.camp_id = documents.camp_id and cu.user_id = auth.uid())
       or p.role in ('מנהל רשת','אדמין מערכת')
  )
);

-- ============================================================
-- STAFF (צוות)
-- ============================================================
create table if not exists staff (
  id           uuid primary key default gen_random_uuid(),
  camp_id      uuid not null references camps(id) on delete cascade,
  full_name    text not null,
  role         text not null,
  phone        text,
  email        text,
  salary       numeric(10,2),
  salary_type  text default 'חודשי' check (salary_type in ('חודשי','יומי','שעתי')),
  start_date   date,
  end_date     date,
  notes        text,
  created_at   timestamptz default now()
);
alter table staff enable row level security;
create policy "staff by camp" on staff for all using (
  exists (
    select 1 from camp_users cu join profiles p on p.id = auth.uid()
    where (cu.camp_id = staff.camp_id and cu.user_id = auth.uid())
       or p.role in ('מנהל רשת','אדמין מערכת')
  )
);

-- ============================================================
-- DAILY PLANS (תכנון יומי)
-- ============================================================
create table if not exists daily_plans (
  id           uuid primary key default gen_random_uuid(),
  camp_id      uuid not null references camps(id) on delete cascade,
  plan_date    date not null,
  topic        text,
  notes        text,
  created_at   timestamptz default now(),
  unique(camp_id, plan_date)
);
alter table daily_plans enable row level security;
create policy "plans by camp" on daily_plans for all using (
  exists (
    select 1 from camp_users cu join profiles p on p.id = auth.uid()
    where (cu.camp_id = daily_plans.camp_id and cu.user_id = auth.uid())
       or p.role in ('מנהל רשת','אדמין מערכת')
  )
);

create table if not exists activities (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references daily_plans(id) on delete cascade,
  start_time     time,
  end_time       time,
  title          text not null,
  description    text,
  materials_url  text,
  responsible    text,
  created_at     timestamptz default now()
);
alter table activities enable row level security;
create policy "activities all" on activities for all using (true);

create table if not exists plan_files (
  id           uuid primary key default gen_random_uuid(),
  plan_id      uuid not null references daily_plans(id) on delete cascade,
  camp_id      uuid not null references camps(id) on delete cascade,
  file_name    text not null,
  file_url     text not null,
  file_size    bigint,
  created_at   timestamptz default now()
);
alter table plan_files enable row level security;
create policy "plan_files all" on plan_files for all using (true);

-- ============================================================
-- ALERTS (התראות חכמות)
-- ============================================================
create table if not exists alerts (
  id           uuid primary key default gen_random_uuid(),
  camp_id      uuid references camps(id) on delete cascade,
  alert_type   text not null,
  severity     text default 'info' check (severity in ('info','warning','error')),
  title        text not null,
  body         text,
  is_read      boolean default false,
  created_at   timestamptz default now()
);
alter table alerts enable row level security;
create policy "alerts by camp" on alerts for all using (
  exists (
    select 1 from camp_users cu join profiles p on p.id = auth.uid()
    where (cu.camp_id = alerts.camp_id and cu.user_id = auth.uid())
       or p.role in ('מנהל רשת','אדמין מערכת')
  )
);

-- ============================================================
-- PAYMENT TRANSACTIONS (סליקה)
-- ============================================================
create table if not exists payment_transactions (
  id              uuid primary key default gen_random_uuid(),
  registrant_id   uuid not null references registrants(id) on delete cascade,
  camp_id         uuid not null references camps(id) on delete cascade,
  amount          numeric(10,2) not null,
  status          text default 'pending' check (status in ('pending','paid','failed','cancelled')),
  provider        text default 'cardcom',
  provider_ref    text,
  payment_url     text,
  created_at      timestamptz default now(),
  paid_at         timestamptz
);
alter table payment_transactions enable row level security;
create policy "payments by camp" on payment_transactions for all using (
  exists (
    select 1 from camp_users cu join profiles p on p.id = auth.uid()
    where (cu.camp_id = payment_transactions.camp_id and cu.user_id = auth.uid())
       or p.role in ('מנהל רשת','אדמין מערכת')
  )
);

-- ============================================================
-- TRIGGER: auto-create profile on user signup
-- ============================================================
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'שליח')
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- VENDORS (ספקים — רשת)
-- ============================================================
create table if not exists vendors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz default now()
);
alter table vendors enable row level security;
create policy "vendors read" on vendors for select using (auth.uid() is not null);
create policy "vendors manage" on vendors for all using (auth.uid() is not null);

-- ============================================================
-- STORAGE: camp-documents bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('camp-documents', 'camp-documents', false)
on conflict (id) do nothing;
