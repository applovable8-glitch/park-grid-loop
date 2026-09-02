-- 1. referral code on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid;

CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE c text; ok boolean;
BEGIN
  LOOP
    c := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    SELECT NOT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = c) INTO ok;
    EXIT WHEN ok;
  END LOOP;
  RETURN c;
END $$;

UPDATE public.profiles SET referral_code = public.gen_referral_code() WHERE referral_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code);

CREATE OR REPLACE FUNCTION public.tg_set_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN NEW.referral_code := public.gen_referral_code(); END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_referral_code ON public.profiles;
CREATE TRIGGER trg_profiles_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_set_referral_code();

-- 2. referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  points_awarded integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referee_id)
);

GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "participants read referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

DROP TRIGGER IF EXISTS trg_referrals_updated ON public.referrals;
CREATE TRIGGER trg_referrals_updated
BEFORE UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION public.tg_update_updated_at();

-- 3. redeem
CREATE OR REPLACE FUNCTION public.redeem_referral(p_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_ref uuid; v_me uuid := auth.uid(); v_name text; v_pts integer := 100;
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT user_id INTO v_ref FROM public.profiles WHERE referral_code = upper(trim(p_code));
  IF v_ref IS NULL THEN RAISE EXCEPTION 'invalid_code'; END IF;
  IF v_ref = v_me THEN RAISE EXCEPTION 'own_code'; END IF;
  IF EXISTS (SELECT 1 FROM public.referrals WHERE referee_id = v_me) THEN RAISE EXCEPTION 'already_referred'; END IF;

  INSERT INTO public.referrals (referrer_id, referee_id, code, points_awarded)
  VALUES (v_ref, v_me, upper(trim(p_code)), v_pts);

  UPDATE public.profiles SET points = points + v_pts, referred_by = v_ref WHERE user_id = v_me;
  UPDATE public.profiles SET points = points + v_pts WHERE user_id = v_ref;

  INSERT INTO public.points_transactions (user_id, delta, reason, metadata)
  VALUES (v_me, v_pts, 'referral_joined', jsonb_build_object('referrer_id', v_ref)),
         (v_ref, v_pts, 'referral_bonus', jsonb_build_object('referee_id', v_me));

  SELECT name INTO v_name FROM public.profiles WHERE user_id = v_me;
  PERFORM public.push_notification(v_ref, 'You earned ' || v_pts || ' points',
    coalesce(v_name, 'A friend') || ' joined ParkOut with your invite link.', 'points',
    jsonb_build_object('kind', 'referral', 'referee_id', v_me));
END $$;