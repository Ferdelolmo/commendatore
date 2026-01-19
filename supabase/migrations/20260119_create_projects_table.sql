-- Create projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  name text not null,
  coordinator_code text not null, -- In a real app, hash this. For prototype simplicity, plain text is often used but discouraged.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Turn on RLS
alter table public.projects enable row level security;

-- Allow public read access to verify project existence (needed for Step 1 of login)
-- Note: We generally don't want to expose valid slugs to enumeration, but for this prototype flow it's necessary.
-- However, we MUST NOT expose the coordinator_code to the public.
create policy "Allow public read of project metadata"
on public.projects
for select
to public
using (true);

-- Create a secure function to verify coordinator code
create or replace function verify_project_coordinator_code(project_slug text, code_attempt text)
returns boolean
language plpgsql
security definer -- Runs with privileges of creator (postgres/admin), bypassing RLS
as $$
declare
  is_valid boolean;
begin
  select (coordinator_code = code_attempt) into is_valid
  from public.projects
  where slug = project_slug;
  
  return coalesce(is_valid, false);
end;
$$;

-- Seed the initial project
insert into public.projects (slug, name, coordinator_code)
values ('chiaraefer', 'Chiara & Fer Wedding', '2026')
on conflict (slug) do nothing;
