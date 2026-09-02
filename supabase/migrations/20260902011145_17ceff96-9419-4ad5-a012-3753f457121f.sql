WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC) rn
  FROM public.parking_spots
  WHERE status IN ('available','leaving','reserved')
)
UPDATE public.parking_spots p SET status='completed'
FROM ranked r WHERE p.id = r.id AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS parking_spots_one_active_per_user
  ON public.parking_spots (user_id)
  WHERE status IN ('available','leaving','reserved');