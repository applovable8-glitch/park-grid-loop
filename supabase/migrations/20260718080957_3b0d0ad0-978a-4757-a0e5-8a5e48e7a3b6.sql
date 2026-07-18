
-- ============ ENUMS ============
CREATE TYPE public.spot_status AS ENUM ('available','leaving','reserved','expired','completed','cancelled');
CREATE TYPE public.reservation_status AS ENUM ('active','completed','expired','cancelled');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text,
  phone text,
  plate text,
  avatar_url text,
  language text NOT NULL DEFAULT 'en',
  theme text NOT NULL DEFAULT 'system',
  notification_prefs jsonb NOT NULL DEFAULT '{"push":true,"nearby_spots":true,"reservations":true,"points":true}'::jsonb,
  location_prefs jsonb NOT NULL DEFAULT '{"radius_m":800,"share_location":true}'::jsonb,
  points integer NOT NULL DEFAULT 100,
  reputation numeric(3,2) NOT NULL DEFAULT 5.00,
  shared_count integer NOT NULL DEFAULT 0,
  reservation_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users manage own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ PARKING SPOTS ============
CREATE TABLE public.parking_spots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  address text,
  status public.spot_status NOT NULL DEFAULT 'available',
  leave_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  cost integer NOT NULL DEFAULT 10,
  reserved_by uuid REFERENCES auth.users(id),
  reserved_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX parking_spots_status_idx ON public.parking_spots(status);
CREATE INDEX parking_spots_expires_idx ON public.parking_spots(expires_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parking_spots TO authenticated;
GRANT ALL ON public.parking_spots TO service_role;
ALTER TABLE public.parking_spots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spots readable by authenticated" ON public.parking_spots FOR SELECT TO authenticated USING (true);
CREATE POLICY "users insert own spots" ON public.parking_spots FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owners or reservers update" ON public.parking_spots FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = reserved_by OR reserved_by IS NULL)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = reserved_by OR reserved_by IS NULL);
CREATE POLICY "users delete own spots" ON public.parking_spots FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============ RESERVATIONS ============
CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spot_id uuid NOT NULL REFERENCES public.parking_spots(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.reservation_status NOT NULL DEFAULT 'active',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '90 seconds'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reservations_user_idx ON public.reservations(user_id);
CREATE INDEX reservations_spot_idx ON public.reservations(spot_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reservations TO authenticated;
GRANT ALL ON public.reservations TO service_role;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reservations readable by authenticated" ON public.reservations FOR SELECT TO authenticated USING (true);
CREATE POLICY "users insert own reservations" ON public.reservations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users update own reservations" ON public.reservations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ POINTS TRANSACTIONS ============
CREATE TABLE public.points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX points_tx_user_idx ON public.points_transactions(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.points_transactions TO authenticated;
GRANT ALL ON public.points_transactions TO service_role;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own points tx" ON public.points_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users insert own points tx" ON public.points_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'spot',
  read boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users insert own notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ update_updated_at trigger ============
CREATE OR REPLACE FUNCTION public.tg_update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.tg_update_updated_at();
CREATE TRIGGER trg_spots_updated BEFORE UPDATE ON public.parking_spots FOR EACH ROW EXECUTE FUNCTION public.tg_update_updated_at();
CREATE TRIGGER trg_reservations_updated BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE FUNCTION public.tg_update_updated_at();

-- ============ auto-create profile on signup ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ realtime ============
ALTER TABLE public.parking_spots REPLICA IDENTITY FULL;
ALTER TABLE public.reservations REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_spots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
