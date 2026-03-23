-- Run this in your Supabase SQL Editor to add the 'side' column
ALTER TABLE public.guests
ADD COLUMN IF NOT EXISTS side text DEFAULT 'Both';

-- Validate it accepts only correct values
ALTER TABLE public.guests 
ADD CONSTRAINT check_guest_side 
CHECK (side IN ('Fernando', 'Chiara', 'Both'));
