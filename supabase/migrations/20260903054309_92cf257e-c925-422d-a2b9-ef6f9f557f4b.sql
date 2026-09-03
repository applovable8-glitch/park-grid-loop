ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS seeker_lat double precision,
  ADD COLUMN IF NOT EXISTS seeker_lng double precision,
  ADD COLUMN IF NOT EXISTS seeker_loc_at timestamptz;