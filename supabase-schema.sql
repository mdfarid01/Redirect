create table if not exists public.demo_submissions (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  phone text not null,
  source_url text,
  created_at timestamptz not null default now()
);