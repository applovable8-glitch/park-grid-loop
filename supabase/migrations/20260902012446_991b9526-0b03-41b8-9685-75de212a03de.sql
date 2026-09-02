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

GRANT EXECUTE ON FUNCTION public.respond_to_request(uuid, text, timestamptz) TO authenticated;