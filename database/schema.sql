-- =====================================================================
--  MARAFA MULTI-SERVICES LIMITED — Operations Portal
--  Supabase database schema
--
--  HOW TO USE:
--  1. Create a project at https://supabase.com
--  2. Open your project → SQL Editor → New Query
--  3. Paste this ENTIRE file and click "Run"
--  4. Then go to Authentication → Providers → Email and (recommended for
--     an internal team tool) turn OFF "Confirm email" so new staff
--     logins work immediately without needing to click an email link.
--  5. Go to Authentication → Users → "Add user" and manually create the
--     first login (e.g. the two Directors) with "Auto Confirm User" ON.
--  6. After creating each Auth user, run the matching INSERT at the
--     bottom of this file (or add them from the app's "Manage Access"
--     page once your very first user is logged in).
-- =====================================================================

-- ---------------------------------------------------------------------
-- PROFILES — one row per login account (extends Supabase's auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  email text,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');
drop policy if exists "profiles_insert_authenticated" on public.profiles;
create policy "profiles_insert_authenticated" on public.profiles
  for insert with check (auth.role() = 'authenticated');
  -- (any logged-in staff member can provision a profile row for a new
  --  teammate — this is what lets Directors add staff logins in-app)
drop policy if exists "profiles_update_authenticated" on public.profiles;
create policy "profiles_update_authenticated" on public.profiles
  for update using (auth.role() = 'authenticated');

-- Helper: is the currently logged-in user an active staff member?
-- (security definer avoids recursive RLS checks on the profiles table)
create or replace function public.is_active_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_active from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------
-- STAFF — HR records (separate from login accounts above)
-- ---------------------------------------------------------------------
create table if not exists public.staff (
  id bigint generated always as identity primary key,
  name text not null,
  role text,
  department text,
  phone text,
  email text,
  joined date,
  status text default 'Active',
  created_at timestamptz default now()
);
alter table public.staff enable row level security;
drop policy if exists "staff_all_access" on public.staff;
create policy "staff_all_access" on public.staff
  for all using (public.is_active_staff()) with check (public.is_active_staff());

insert into public.staff (name, role, department, phone, email, joined, status) values
('Lawali Ibrahim Marafa', 'Director', 'Management', '+234 810 920 2315', 'marafa123419@gmail.com', '2026-08-24', 'Active'),
('Aisha Muhammad Ibrahim', 'Director', 'Management', '+234 813 590 2072', 'aishaibrahimmuhammad902@gmail.com', '2026-08-24', 'Active')
on conflict do nothing;

-- ---------------------------------------------------------------------
-- PROJECTS & SERVICES
-- ---------------------------------------------------------------------
create table if not exists public.projects (
  id bigint generated always as identity primary key,
  name text not null,
  client text,
  category text,
  status text default 'Planned',
  start_date date,
  end_date date,
  value numeric,
  notes text,
  created_at timestamptz default now()
);
alter table public.projects enable row level security;
drop policy if exists "projects_all_access" on public.projects;
create policy "projects_all_access" on public.projects
  for all using (public.is_active_staff()) with check (public.is_active_staff());

-- ---------------------------------------------------------------------
-- SALES / RECEIPTS
-- ---------------------------------------------------------------------
create table if not exists public.sales (
  id bigint generated always as identity primary key,
  receipt_no text,
  sale_date date,
  client text,
  description text,
  amount numeric,
  status text default 'Unpaid',        -- 'Unpaid' or 'Paid'
  project_id bigint references public.projects(id) on delete set null,
  issued_by text,
  paid_at timestamptz,
  created_at timestamptz default now()
);
alter table public.sales enable row level security;
drop policy if exists "sales_all_access" on public.sales;
create policy "sales_all_access" on public.sales
  for all using (public.is_active_staff()) with check (public.is_active_staff());

-- ---------------------------------------------------------------------
-- EXPENSES
-- ---------------------------------------------------------------------
create table if not exists public.expenses (
  id bigint generated always as identity primary key,
  expense_date date,
  category text,
  amount numeric,
  description text,
  paid_to text,
  created_at timestamptz default now()
);
alter table public.expenses enable row level security;
drop policy if exists "expenses_all_access" on public.expenses;
create policy "expenses_all_access" on public.expenses
  for all using (public.is_active_staff()) with check (public.is_active_staff());

-- ---------------------------------------------------------------------
-- COMPANY SETTINGS — single row of editable company info
-- ---------------------------------------------------------------------
create table if not exists public.company_settings (
  id int primary key default 1,
  name text,
  rc text,
  address text,
  email text,
  phone text,
  constraint single_row check (id = 1)
);
alter table public.company_settings enable row level security;
drop policy if exists "company_settings_all_access" on public.company_settings;
create policy "company_settings_all_access" on public.company_settings
  for all using (public.is_active_staff()) with check (public.is_active_staff());

insert into public.company_settings (id, name, rc, address, email, phone) values
(1, 'Marafa Multi-Services Limited', '9797637',
   '14, Kakaki Road, Unguwar Rimi, off Bamako Road, Kaduna, Kaduna State, Nigeria',
   'marafa123419@gmail.com', '+234 810 920 2315')
on conflict (id) do nothing;

-- =====================================================================
--  GALLERY — public-facing photo/video gallery
--  Anyone can VIEW these on the website; only logged-in staff can add,
--  edit, or remove them.
-- =====================================================================
create table if not exists public.gallery_items (
  id bigint generated always as identity primary key,
  media_type text default 'image',   -- 'image' or 'video'
  url text not null,
  caption text,
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table public.gallery_items enable row level security;
drop policy if exists "gallery_public_read" on public.gallery_items;
create policy "gallery_public_read" on public.gallery_items for select using (true);
drop policy if exists "gallery_staff_insert" on public.gallery_items;
create policy "gallery_staff_insert" on public.gallery_items for insert with check (public.is_active_staff());
drop policy if exists "gallery_staff_update" on public.gallery_items;
create policy "gallery_staff_update" on public.gallery_items for update using (public.is_active_staff());
drop policy if exists "gallery_staff_delete" on public.gallery_items;
create policy "gallery_staff_delete" on public.gallery_items for delete using (public.is_active_staff());

-- =====================================================================
--  PROJECT SHOWCASE — the public portfolio shown on the website
--  (separate from the private "projects" table above, which is your
--  internal client/contract tracker and is never shown publicly)
-- =====================================================================
create table if not exists public.showcase_projects (
  id bigint generated always as identity primary key,
  title text not null,
  description text,
  status text default 'Ongoing',     -- 'Ongoing' or 'Completed'
  cover_image text,
  images text[] default '{}',
  sort_order int default 0,
  created_at timestamptz default now()
);
alter table public.showcase_projects enable row level security;
drop policy if exists "showcase_public_read" on public.showcase_projects;
create policy "showcase_public_read" on public.showcase_projects for select using (true);
drop policy if exists "showcase_staff_insert" on public.showcase_projects;
create policy "showcase_staff_insert" on public.showcase_projects for insert with check (public.is_active_staff());
drop policy if exists "showcase_staff_update" on public.showcase_projects;
create policy "showcase_staff_update" on public.showcase_projects for update using (public.is_active_staff());
drop policy if exists "showcase_staff_delete" on public.showcase_projects;
create policy "showcase_staff_delete" on public.showcase_projects for delete using (public.is_active_staff());

-- =====================================================================
--  STORAGE — for uploaded gallery/project images and videos
--  MANUAL STEP FIRST: in the Supabase Dashboard, go to Storage → New
--  bucket → name it exactly "media" → toggle "Public bucket" ON → Save.
--  Then run the policies below.
-- =====================================================================
drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects
  for select using (bucket_id = 'media');
drop policy if exists "media_staff_upload" on storage.objects;
create policy "media_staff_upload" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_active_staff());
drop policy if exists "media_staff_delete" on storage.objects;
create policy "media_staff_delete" on storage.objects
  for delete using (bucket_id = 'media' and public.is_active_staff());

-- =====================================================================
--  AFTER creating your first Auth user(s) in the Dashboard
--  (Authentication → Users → Add user), run this for EACH one so they
--  show up correctly in "Manage Access" inside the app.
--  Replace the values, then run it in the SQL Editor:
-- =====================================================================
-- insert into public.profiles (id, full_name, email, is_active)
-- values ('PASTE-THE-USER-UUID-HERE', 'Lawali Ibrahim Marafa', 'marafa123419@gmail.com', true);
