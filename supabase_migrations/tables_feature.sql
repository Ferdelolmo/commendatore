-- Create tables table
create table public.tables (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  shape text not null check (shape in ('circle', 'square', 'rectangle')),
  capacity jsonb not null,
  position jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add table_id to guests if it doesn't exist
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'guests' and column_name = 'table_id') then
    alter table public.guests add column table_id uuid references public.tables(id);
  end if;
end $$;

-- Enable RLS
alter table public.tables enable row level security;

-- Create policies (modify as needed for your auth setup)
create policy "Enable read access for all users" on public.tables for select using (true);
create policy "Enable insert for authenticated users only" on public.tables for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on public.tables for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on public.tables for delete using (auth.role() = 'authenticated');
