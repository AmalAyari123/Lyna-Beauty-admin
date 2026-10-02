CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_date date NOT NULL,
  slot_hour int NOT NULL CHECK (slot_hour >= 10 AND slot_hour <= 19),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  note text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX appointments_unique_active_slot
  ON public.appointments (slot_date, slot_hour)
  WHERE status = 'active';

GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
-- No anon/authenticated policies: all client access goes through the
-- security definer functions below so client details stay private.

CREATE OR REPLACE FUNCTION public.get_booked_hours(p_date date)
RETURNS SETOF int
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT slot_hour FROM public.appointments
  WHERE slot_date = p_date AND status = 'active'
$$;

CREATE OR REPLACE FUNCTION public.book_appointment(
  p_date date,
  p_hour int,
  p_name text,
  p_phone text,
  p_email text DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_hour < 10 OR p_hour > 19 THEN
    RAISE EXCEPTION 'Créneau invalide';
  END IF;
  IF btrim(coalesce(p_name, '')) = '' OR length(p_name) > 100 THEN
    RAISE EXCEPTION 'Nom invalide';
  END IF;
  IF btrim(coalesce(p_phone, '')) = '' OR length(p_phone) > 30 THEN
    RAISE EXCEPTION 'Téléphone invalide';
  END IF;
  IF (p_date + make_interval(hours => p_hour)) < (now() AT TIME ZONE 'Europe/Paris') THEN
    RAISE EXCEPTION 'Créneau déjà passé';
  END IF;

  INSERT INTO public.appointments (slot_date, slot_hour, full_name, phone, email, note)
  VALUES (p_date, p_hour, btrim(p_name), btrim(p_phone), nullif(btrim(coalesce(p_email,'')), ''), nullif(btrim(coalesce(p_note,'')), ''))
  RETURNING id INTO v_id;

  RETURN v_id;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Ce créneau vient d''être réservé';
END;
$$;

CREATE OR REPLACE FUNCTION public.find_my_appointments(p_contact text)
RETURNS TABLE (id uuid, slot_date date, slot_hour int, full_name text, note text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.slot_date, a.slot_hour, a.full_name, a.note
  FROM public.appointments a
  WHERE a.status = 'active'
    AND btrim(coalesce(p_contact, '')) <> ''
    AND (
      lower(a.phone) = lower(btrim(p_contact))
      OR regexp_replace(a.phone, '[^0-9]', '', 'g') = regexp_replace(btrim(p_contact), '[^0-9]', '', 'g')
      OR lower(coalesce(a.email, '')) = lower(btrim(p_contact))
    )
    AND (a.slot_date + make_interval(hours => a.slot_hour)) >= (now() AT TIME ZONE 'Europe/Paris')
  ORDER BY a.slot_date, a.slot_hour
$$;

CREATE OR REPLACE FUNCTION public.cancel_appointment(p_id uuid, p_contact text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  UPDATE public.appointments a
  SET status = 'cancelled'
  WHERE a.id = p_id
    AND a.status = 'active'
    AND btrim(coalesce(p_contact, '')) <> ''
    AND (
      regexp_replace(a.phone, '[^0-9]', '', 'g') = regexp_replace(btrim(p_contact), '[^0-9]', '', 'g')
      OR lower(coalesce(a.email, '')) = lower(btrim(p_contact))
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.get_booked_hours(date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.book_appointment(date, int, text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_my_appointments(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_appointment(uuid, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_booked_hours(date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment(date, int, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_my_appointments(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_appointment(uuid, text) TO anon, authenticated;
