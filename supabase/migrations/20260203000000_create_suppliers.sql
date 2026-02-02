create table public.suppliers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null,
  contact_info text,
  status text not null default 'Proposed',
  price numeric,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.suppliers enable row level security;

-- Policy to allow authenticated users to view/edit
create policy "Enable all access for authenticated users"
on public.suppliers
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');
