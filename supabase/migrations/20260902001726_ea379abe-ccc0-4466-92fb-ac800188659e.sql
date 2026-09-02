-- 1. Spot planned departure / extension support
ALTER TABLE public.parking_spots
  ADD COLUMN IF NOT EXISTS planned_leave_at timestamptz,
  ADD COLUMN IF NOT EXISTS extension_count int NOT NULL DEFAULT 0;

UPDATE public.parking_spots SET planned_leave_at = leave_at WHERE planned_leave_at IS NULL;

-- 2. Reservation negotiation state
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS request_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS proposed_leave_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_id uuid,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz;

DO $$ BEGIN
  ALTER TABLE public.reservations
    ADD CONSTRAINT reservations_request_status_check
    CHECK (request_status IN ('pending','extension_proposed','confirmed','declined','cancelled','expired','completed'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE public.reservations r
   SET owner_id = s.user_id
  FROM public.parking_spots s
 WHERE s.id = r.spot_id AND r.owner_id IS NULL;

-- one open request per seeker, and per spot
CREATE UNIQUE INDEX IF NOT EXISTS reservations_one_open_per_user
  ON public.reservations (user_id)
  WHERE request_status IN ('pending','extension_proposed','confirmed');

CREATE UNIQUE INDEX IF NOT EXISTS reservations_one_open_per_spot
  ON public.reservations (spot_id)
  WHERE request_status IN ('pending','extension_proposed','confirmed');

-- 3. Policies so both parties can see the negotiation
DROP POLICY IF EXISTS "Owner can view requests on own spots" ON public.reservations;
CREATE POLICY "Owner can view requests on own spots"
  ON public.reservations FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR user_id = auth.uid());

-- 4. Helper: notify
CREATE OR REPLACE FUNCTION public.push_notification(_user_id uuid, _title text, _body text, _icon text, _meta jsonb DEFAULT '{}'::jsonb)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications (user_id, title, body, icon, metadata)
  VALUES (_user_id, _title, _body, _icon, _meta);
$$;

-- 5. Request a spot
CREATE OR REPLACE FUNCTION public.request_spot(p_spot_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_spot public.parking_spots; v_id uuid; v_name text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  SELECT * INTO v_spot FROM public.parking_spots WHERE id = p_spot_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'spot_not_found'; END IF;
  IF v_spot.user_id = auth.uid() THEN RAISE EXCEPTION 'own_spot'; END IF;
  IF EXISTS (SELECT 1 FROM public.reservations WHERE user_id = auth.uid()
             AND request_status IN ('pending','extension_proposed','confirmed'))
  THEN RAISE EXCEPTION 'already_has_open_request'; END IF;
  IF EXISTS (SELECT 1 FROM public.reservations WHERE spot_id = p_spot_id
             AND request_status IN ('pending','extension_proposed','confirmed'))
  THEN RAISE EXCEPTION 'spot_already_requested'; END IF;

  INSERT INTO public.reservations (spot_id, user_id, owner_id, request_status, status, expires_at)
  VALUES (p_spot_id, auth.uid(), v_spot.user_id, 'pending', 'active', now() + interval '5 minutes')
  RETURNING id INTO v_id;

  SELECT name INTO v_name FROM public.profiles WHERE user_id = auth.uid();
  PERFORM public.push_notification(v_spot.user_id, 'Someone wants your spot',
    coalesce(v_name,'A driver') || ' wants your parking spot at your planned exit time. Approve or extend your stay.',
    'reserve', jsonb_build_object('reservation_id', v_id, 'spot_id', p_spot_id, 'kind', 'request'));
  RETURN v_id;
END $$;

-- 6. Owner responds: approve or propose extension
CREATE OR REPLACE FUNCTION public.respond_to_request(p_reservation_id uuid, p_action text, p_new_leave_at timestamptz DEFAULT NULL)
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
    UPDATE public.profiles SET points = greatest(0, points - s.cost), reservation_count = reservation_count + 1 WHERE user_id = r.user_id;
    UPDATE public.profiles SET points = points + s.cost, shared_count = shared_count + 1 WHERE user_id = r.owner_id;
    INSERT INTO public.points_transactions (user_id, delta, reason, metadata)
      VALUES (r.user_id, -s.cost, 'reservation', jsonb_build_object('spot_id', s.id)),
             (r.owner_id, s.cost, 'spot_shared', jsonb_build_object('spot_id', s.id));
    PERFORM public.push_notification(r.user_id, 'Reservation confirmed',
      'The driver accepted. The spot is reserved for you.', 'reserve',
      jsonb_build_object('reservation_id', r.id, 'spot_id', s.id, 'kind','confirmed'));

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

-- 7. Seeker answers extension proposal
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
    UPDATE public.profiles SET points = greatest(0, points - s.cost), reservation_count = reservation_count + 1 WHERE user_id = r.user_id;
    UPDATE public.profiles SET points = points + s.cost, shared_count = shared_count + 1 WHERE user_id = r.owner_id;
    INSERT INTO public.points_transactions (user_id, delta, reason, metadata)
      VALUES (r.user_id, -s.cost, 'reservation', jsonb_build_object('spot_id', s.id)),
             (r.owner_id, s.cost, 'spot_shared', jsonb_build_object('spot_id', s.id));
    PERFORM public.push_notification(r.owner_id, 'Reservation confirmed',
      'The driver accepted your new exit time.', 'reserve',
      jsonb_build_object('reservation_id', r.id, 'spot_id', s.id, 'kind','confirmed'));
  ELSE
    UPDATE public.reservations SET request_status='declined', status='cancelled' WHERE id = r.id;
    PERFORM public.push_notification(r.owner_id, 'Request withdrawn',
      'The driver chose another spot.', 'expire',
      jsonb_build_object('reservation_id', r.id, 'spot_id', s.id, 'kind','declined'));
  END IF;
END $$;

-- 8. Either party cancels
CREATE OR REPLACE FUNCTION public.cancel_request(p_reservation_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.reservations; v_other uuid;
BEGIN
  SELECT * INTO r FROM public.reservations WHERE id = p_reservation_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'not_found'; END IF;
  IF auth.uid() NOT IN (r.user_id, r.owner_id) THEN RAISE EXCEPTION 'forbidden'; END IF;
  IF r.request_status NOT IN ('pending','extension_proposed','confirmed') THEN RETURN; END IF;

  UPDATE public.reservations SET request_status='cancelled', status='cancelled' WHERE id = r.id;
  UPDATE public.parking_spots SET status = CASE WHEN status='reserved' THEN 'leaving'::spot_status ELSE status END,
    reserved_by = NULL, reserved_until = NULL WHERE id = r.spot_id;
  v_other := CASE WHEN auth.uid() = r.user_id THEN r.owner_id ELSE r.user_id END;
  PERFORM public.push_notification(v_other, 'Request cancelled',
    'The parking request was cancelled.', 'expire',
    jsonb_build_object('reservation_id', r.id, 'spot_id', r.spot_id, 'kind','cancelled'));
END $$;

-- 9. Owner updates planned exit time on own spot
CREATE OR REPLACE FUNCTION public.set_planned_leave(p_spot_id uuid, p_leave_at timestamptz)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.parking_spots;
BEGIN
  SELECT * INTO s FROM public.parking_spots WHERE id = p_spot_id FOR UPDATE;
  IF NOT FOUND OR s.user_id <> auth.uid() THEN RAISE EXCEPTION 'forbidden'; END IF;
  UPDATE public.parking_spots SET planned_leave_at = p_leave_at, leave_at = p_leave_at,
    expires_at = p_leave_at + interval '30 minutes' WHERE id = p_spot_id;
END $$;

GRANT EXECUTE ON FUNCTION public.request_spot(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_request(uuid, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.answer_extension(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_planned_leave(uuid, timestamptz) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.push_notification(uuid, text, text, text, jsonb) FROM anon, authenticated;