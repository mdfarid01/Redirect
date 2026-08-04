create table if not exists public.demo_submissions (
  id bigint generated always as identity primary key,
  email text not null,
  phone text not null,
  source_url text,
  created_at timestamptz not null default now()
);

-- Run this too when updating an existing table created by an earlier version.
alter table public.demo_submissions drop column if exists name;
