CREATE TABLE IF NOT EXISTS public.point_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL UNIQUE,
  price_id text NOT NULL,
  points integer NOT NULL,
  amount_total integer,
  currency text,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.point_purchases TO authenticated;
GRANT ALL ON public.point_purchases TO service_role;

ALTER TABLE public.point_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own point purchases" ON public.point_purchases
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.credit_purchased_points(
  _user_id uuid,
  _session_id text,
  _price_id text,
  _points integer,
  _amount_total integer,
  _currency text,
  _environment text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE inserted boolean := false;
BEGIN
  INSERT INTO public.point_purchases (user_id, session_id, price_id, points, amount_total, currency, environment)
  VALUES (_user_id, _session_id, _price_id, _points, _amount_total, _currency, _environment)
  ON CONFLICT (session_id) DO NOTHING;
  GET DIAGNOSTICS inserted = ROW_COUNT;
  IF inserted THEN
    UPDATE public.profiles SET points = COALESCE(points, 0) + _points WHERE user_id = _user_id;
  END IF;
  RETURN inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.credit_purchased_points(uuid, text, text, integer, integer, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_purchased_points(uuid, text, text, integer, integer, text, text) TO service_role;