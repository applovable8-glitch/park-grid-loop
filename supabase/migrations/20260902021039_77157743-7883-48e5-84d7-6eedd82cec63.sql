-- 1. ratings ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id uuid NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ratee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stars smallint NOT NULL,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reservation_id, rater_id)
);

GRANT SELECT, INSERT ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings readable by authenticated" ON public.ratings
  FOR SELECT TO authenticated USING (true);

DROP TRIGGER IF EXISTS trg_ratings_updated ON public.ratings;
CREATE TRIGGER trg_ratings_updated
BEFORE UPDATE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.tg_update_updated_at();

CREATE OR REPLACE FUNCTION public.tg_ratings_check()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.stars < 1 OR NEW.stars > 5 THEN RAISE EXCEPTION 'invalid_stars'; END IF;
  IF NEW.rater_id = NEW.ratee_id THEN RAISE EXCEPTION 'self_rating'; END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_ratings_check ON public.ratings;
CREATE TRIGGER trg_ratings_check
BEFORE INSERT OR UPDATE ON public.ratings
FOR EACH ROW EXECUTE FUNCTION public.tg_ratings_check();

-- 2. points move to completion time -----------------------------------------
CREATE OR REPLACE FUNCTION public.respond_to_request(p_reservation_id uuid, p_action text, p_new_leave_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reservations; s public.parking_spots;
BEGIN
  SELECT * INTO r FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF r.owner_id <> auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF r.request_status <> 'pending' THEN RAISE EXCEPTION 'invalid_state'; END IF;
  SELECT * INTO s FROM public.parking_spots WHERE id = r.spot_id FOR UPDATE;

  IF p_action = 'approve' THEN
    UPDATE public.reservations SET request_status='confirmed', responded_at=now(),
      expires_at = coalesce(s.planned_leave_at, s.leave_at) + interval '15 minutes' WHERE id = r.id;
    UPDATE public.parking_spots SET status='reserved', reserved_by=r.user_id,
      reserved_until = coalesce(planned_leave_at, leave_at) + interval '15 minutes' WHERE id = s.id;
    PERFORM public.push_notification(r.user_id, 'Reservation confirmed',
      'The driver accepted. The spot is reserved for you.', 'reserve',
      jsonb_build_object('reservation_id', r.id, 'spot_id', s.id, 'kind','confirmed'));

  ELSIF p_action = 'decline' THEN
    UPDATE public.reservations SET request_status='declined', status='cancelled', responded_at=now() WHERE id = r.id;
    UPDATE public.parking_spots SET status = CASE WHEN coalesce(planned_leave_at, leave_at) <= now() + interval '1 minute' THEN 'available'::spot_status ELSE 'leaving'::spot_status END,
      reserved_by = NULL, reserved_until = NULL WHERE id = s.id;
    PERFORM public.push_notification(r.user_id, 'Request declined',
      'The driver declined your request. Pick another spot nearby.', 'expire',
      jsonb_build_object('reservation_id', r.id, 'spot_id', s.id, 'kind','declined'));

  ELSIF p_action = 'extend' THEN
    IF p_new_leave_at IS NULL THEN RAISE EXCEPTION 'missing_time'; END IF;
    UPDATE public.reservations SET request_status='extension_proposed', proposed_leave_at=p_new_leave_at,
      responded_at=now(), expires_at = now() + interval '10 minutes' WHERE id = r.id;
    UPDATE public.parking_spots SET extension_count = extension_count + 1 WHERE id = s.id;
    PERFORM public.push_notification(r.user_id, 'Driver asked for more time',
      'The driver wants to stay longer. Do you still want this spot?', 'expire',
      jsonb_build_object('reservation_id', r.id, 'spot_id', s.id, 'kind','extension'));
  ELSE
    RAISE EXCEPTION 'invalid_action';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.answer_extension(p_reservation_id uuid, p_accept boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reservations; s public.parking_spots;
BEGIN
  SELECT * INTO r FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF r.user_id <> auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF r.request_status <> 'extension_proposed' THEN RAISE EXCEPTION 'invalid_state'; END IF;
  SELECT * INTO s FROM public.parking_spots WHERE id = r.spot_id FOR UPDATE;

  IF p_accept THEN
    UPDATE public.parking_spots SET planned_leave_at = r.proposed_leave_at, leave_at = r.proposed_leave_at,
      status='reserved', reserved_by=r.user_id, reserved_until = r.proposed_leave_at + interval '15 minutes' WHERE id = s.id;
    UPDATE public.reservations SET request_status='confirmed',
      expires_at = r.proposed_leave_at + interval '15 minutes' WHERE id = r.id;
    PERFORM public.push_notification(r.owner_id, 'Reservation confirmed',
      'The driver accepted your new exit time.', 'reserve',
      jsonb_build_object('reservation_id', r.id, 'spot_id', s.id, 'kind','confirmed'));
  ELSE
    UPDATE public.reservations SET request_status='declined', status='cancelled' WHERE id = r.id;
    UPDATE public.parking_spots SET status = CASE WHEN coalesce(planned_leave_at, leave_at) <= now() + interval '1 minute' THEN 'available'::spot_status ELSE 'leaving'::spot_status END,
      reserved_by = NULL, reserved_until = NULL WHERE id = s.id;
    PERFORM public.push_notification(r.owner_id, 'Request withdrawn',
      'The driver chose another spot.', 'expire',
      jsonb_build_object('reservation_id', r.id, 'spot_id', s.id, 'kind','declined'));
  END IF;
END $$;

-- 3. complete handoff --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_handoff(p_reservation_id uuid, p_taken boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reservations; s public.parking_spots; v_name text;
BEGIN
  SELECT * INTO r FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF r.user_id <> auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF r.request_status <> 'confirmed' THEN RAISE EXCEPTION 'invalid_state'; END IF;
  SELECT * INTO s FROM public.parking_spots WHERE id = r.spot_id FOR UPDATE;
  SELECT name INTO v_name FROM public.profiles WHERE user_id = r.user_id;

  IF p_taken THEN
    UPDATE public.reservations SET request_status='completed', status='completed' WHERE id = r.id;
    UPDATE public.parking_spots SET status='completed', reserved_by=NULL, reserved_until=NULL WHERE id = s.id;

    UPDATE public.profiles SET points = greatest(0, points - s.cost), reservation_count = reservation_count + 1
      WHERE user_id = r.user_id;
    UPDATE public.profiles SET points = points + s.cost, shared_count = shared_count + 1
      WHERE user_id = r.owner_id;
    INSERT INTO public.points_transactions (user_id, delta, reason, metadata)
      VALUES (r.user_id, -s.cost, 'reservation', jsonb_build_object('spot_id', s.id, 'reservation_id', r.id)),
             (r.owner_id, s.cost, 'spot_shared', jsonb_build_object('spot_id', s.id, 'reservation_id', r.id));

    PERFORM public.push_notification(r.owner_id, 'Handoff complete',
      coalesce(v_name,'The driver') || ' took your spot. You earned ' || s.cost || ' points.', 'points',
      jsonb_build_object('reservation_id', r.id, 'spot_id', s.id, 'kind','handoff_done'));
  ELSE
    UPDATE public.reservations SET request_status='cancelled', status='cancelled' WHERE id = r.id;
    UPDATE public.parking_spots
      SET status = CASE WHEN coalesce(planned_leave_at, leave_at) <= now() + interval '1 minute'
                        THEN 'available'::spot_status ELSE 'leaving'::spot_status END,
          reserved_by = NULL, reserved_until = NULL
      WHERE id = s.id;
    PERFORM public.push_notification(r.owner_id, 'Spot not taken',
      coalesce(v_name,'The driver') || ' did not take the spot. It is available again.', 'expire',
      jsonb_build_object('reservation_id', r.id, 'spot_id', s.id, 'kind','handoff_missed'));
  END IF;
END $$;

REVOKE EXECUTE ON FUNCTION public.complete_handoff(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_handoff(uuid, boolean) TO authenticated;

-- 4. rate the other party ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.rate_user(p_reservation_id uuid, p_stars smallint, p_comment text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reservations; v_ratee uuid; v_avg numeric;
BEGIN
  SELECT * INTO r FROM public.reservations WHERE id = p_reservation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF auth.uid() NOT IN (r.user_id, coalesce(r.owner_id, r.user_id)) THEN RAISE EXCEPTION 'forbidden'; END IF;
  v_ratee := CASE WHEN auth.uid() = r.user_id THEN r.owner_id ELSE r.user_id END;
  IF v_ratee IS NULL THEN RAISE EXCEPTION 'not_found'; END IF;

  INSERT INTO public.ratings (reservation_id, rater_id, ratee_id, stars, comment)
  VALUES (p_reservation_id, auth.uid(), v_ratee, p_stars, nullif(trim(coalesce(p_comment,'')), ''))
  ON CONFLICT (reservation_id, rater_id)
  DO UPDATE SET stars = excluded.stars, comment = excluded.comment, updated_at = now();

  SELECT round(avg(stars)::numeric, 2) INTO v_avg FROM public.ratings WHERE ratee_id = v_ratee;
  UPDATE public.profiles SET reputation = coalesce(v_avg, 5.00) WHERE user_id = v_ratee;

  PERFORM public.push_notification(v_ratee, 'You received a rating',
    p_stars || '-star rating from a driver you parked with.', 'points',
    jsonb_build_object('reservation_id', p_reservation_id, 'kind','rating'));
END $$;

REVOKE EXECUTE ON FUNCTION public.rate_user(uuid, smallint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rate_user(uuid, smallint, text) TO authenticated;

-- 5. take over the same location and re-share --------------------------------
CREATE OR REPLACE FUNCTION public.takeover_spot(p_reservation_id uuid, p_leave_at timestamp with time zone)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reservations; s public.parking_spots; v_id uuid; v_bonus integer := 10;
BEGIN
  SELECT * INTO r FROM public.reservations WHERE id = p_reservation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF r.user_id <> auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF r.request_status <> 'completed' THEN RAISE EXCEPTION 'invalid_state'; END IF;
  IF p_leave_at IS NULL THEN RAISE EXCEPTION 'missing_time'; END IF;
  SELECT * INTO s FROM public.parking_spots WHERE id = r.spot_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;

  INSERT INTO public.parking_spots (user_id, lat, lng, address, cost, leave_at, planned_leave_at, expires_at, status)
  VALUES (auth.uid(), s.lat, s.lng, s.address, s.cost, p_leave_at, p_leave_at,
          p_leave_at + interval '30 minutes',
          CASE WHEN p_leave_at <= now() + interval '1 minute' THEN 'available'::spot_status ELSE 'leaving'::spot_status END)
  RETURNING id INTO v_id;

  UPDATE public.profiles SET points = points + v_bonus WHERE user_id = auth.uid();
  INSERT INTO public.points_transactions (user_id, delta, reason, metadata)
  VALUES (auth.uid(), v_bonus, 'share_bonus', jsonb_build_object('spot_id', v_id));

  RETURN v_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.takeover_spot(uuid, timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.takeover_spot(uuid, timestamp with time zone) TO authenticated;