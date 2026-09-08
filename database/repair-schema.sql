-- =====================================================================
--  SCHEMA REPAIR SCRIPT
--  Run this any time you get a "Could not find the 'X' column" error.
--  It safely ADDS any missing columns without touching existing data.
--  Safe to run repeatedly, and safe even if every column already exists.
-- =====================================================================

-- Staff
alter table public.staff add column if not exists name text;
alter table public.staff add column if not exists role text;
alter table public.staff add column if not exists department text;
alter table public.staff add column if not exists phone text;
alter table public.staff add column if not exists email text;
alter table public.staff add column if not exists joined date;
alter table public.staff add column if not exists status text default 'Active';
alter table public.staff add column if not exists created_at timestamptz default now();

-- Projects (internal tracker)
alter table public.projects add column if not exists name text;
alter table public.projects add column if not exists client text;
alter table public.projects add column if not exists category text;
alter table public.projects add column if not exists status text default 'Planned';
alter table public.projects add column if not exists start_date date;
alter table public.projects add column if not exists end_date date;
alter table public.projects add column if not exists value numeric;
alter table public.projects add column if not exists notes text;
alter table public.projects add column if not exists created_at timestamptz default now();

-- Sales / Receipts
alter table public.sales add column if not exists receipt_no text;
alter table public.sales add column if not exists sale_date date;
alter table public.sales add column if not exists client text;
alter table public.sales add column if not exists description text;
alter table public.sales add column if not exists amount numeric;
alter table public.sales add column if not exists status text default 'Unpaid';
alter table public.sales add column if not exists project_id bigint references public.projects(id) on delete set null;
alter table public.sales add column if not exists issued_by text;
alter table public.sales add column if not exists paid_at timestamptz;
alter table public.sales add column if not exists created_at timestamptz default now();

-- Expenses
alter table public.expenses add column if not exists expense_date date;
alter table public.expenses add column if not exists category text;
alter table public.expenses add column if not exists amount numeric;
alter table public.expenses add column if not exists description text;
alter table public.expenses add column if not exists paid_to text;
alter table public.expenses add column if not exists created_at timestamptz default now();

-- Company settings
alter table public.company_settings add column if not exists name text;
alter table public.company_settings add column if not exists rc text;
alter table public.company_settings add column if not exists address text;
alter table public.company_settings add column if not exists email text;
alter table public.company_settings add column if not exists phone text;

-- Gallery
alter table public.gallery_items add column if not exists media_type text default 'image';
alter table public.gallery_items add column if not exists url text;
alter table public.gallery_items add column if not exists caption text;
alter table public.gallery_items add column if not exists sort_order int default 0;
alter table public.gallery_items add column if not exists created_at timestamptz default now();

-- Project Showcase (public portfolio)
alter table public.showcase_projects add column if not exists title text;
alter table public.showcase_projects add column if not exists description text;
alter table public.showcase_projects add column if not exists status text default 'Ongoing';
alter table public.showcase_projects add column if not exists cover_image text;
alter table public.showcase_projects add column if not exists images text[] default '{}';
alter table public.showcase_projects add column if not exists sort_order int default 0;
alter table public.showcase_projects add column if not exists created_at timestamptz default now();

-- Profiles
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists is_active boolean default true;
alter table public.profiles add column if not exists created_at timestamptz default now();
