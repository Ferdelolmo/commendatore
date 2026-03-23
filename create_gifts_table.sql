-- Create the gifts table
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  guest_id UUID REFERENCES public.guests(id) ON DELETE SET NULL,
  group_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Create policies (Based on standard admin/authenticated access)
-- Adjust these based on your specific RLS setup (e.g., if you only want admins to read/write)
CREATE POLICY "Allow read access to authenticated users"
  ON public.gifts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow insert access for authenticated users"
  ON public.gifts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow update access for authenticated users"
  ON public.gifts
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow delete access for authenticated users"
  ON public.gifts
  FOR DELETE
  TO authenticated
  USING (true);

-- Optional: Create an index for faster querying by group or guest
CREATE INDEX IF NOT EXISTS idx_gifts_guest_id ON public.gifts(guest_id);
CREATE INDEX IF NOT EXISTS idx_gifts_group_id ON public.gifts(group_id);
