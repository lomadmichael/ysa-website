-- 018: 본인(/my) 취소 게이트. 2026-09-18 적용 (Supabase MCP apply_migration 로 운영 DB에 반영 완료).
--
-- 배경: 9/17 샵별 명단 전달 뒤에도 /my 본인 취소가 이어졌다. 강습 대기가 0명이 되어 취소가 나와도
--       보충이 안 되고 샵 명단만 흔들리므로 형님 지시로 일단 닫는다.
-- 동작: surfcamp.config.self_cancel_open = false 면 surfcamp_cancel / surfcamp_cancel_program 의
--       본인 호출(p_phone 있음)을 {"ok":false,"error":"cancel_closed"} 로 거부한다.
--       관리자 호출(p_phone NULL, surfcamp_admin_cancel 경유 포함)은 그대로 통과한다.
-- 화면: src/lib/surfcamp-config.ts SELF_CANCEL_CLOSED=true 가 취소 섹션을 안내 문구로 바꾼다.
-- 다시 열 때:  update surfcamp.config set self_cancel_open = true where id = 1;  + SELF_CANCEL_CLOSED=false 배포.

ALTER TABLE surfcamp.config ADD COLUMN IF NOT EXISTS self_cancel_open BOOLEAN NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.surfcamp_cancel(p_registration_id uuid, p_phone text, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_reg       surfcamp.registration%ROWTYPE;
  v_phone_in  TEXT;
  v_freed_l   INT; v_freed_s INT;
  v_promoted  JSONB := '[]'::jsonb;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:2026'));

  SELECT * INTO v_reg FROM surfcamp.registration r
   WHERE r.id = p_registration_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found'); END IF;
  IF v_reg.status <> 'active' THEN
    RETURN jsonb_build_object('ok', true, 'cancelled', false, 'promoted', '[]'::jsonb); END IF;

  IF p_phone IS NOT NULL THEN
    v_phone_in := regexp_replace(p_phone, '\D', '', 'g');
    IF v_phone_in <> v_reg.phone THEN
      RETURN jsonb_build_object('ok', false, 'error', 'forbidden'); END IF;
    -- 018: 본인 취소 게이트
    IF NOT (SELECT c.self_cancel_open FROM surfcamp.config c WHERE c.id = 1) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'cancel_closed'); END IF;
  END IF;

  SELECT count(*) FILTER (WHERE s.program = 'lesson'  AND s.status = 'confirmed'),
         count(*) FILTER (WHERE s.program = 'special' AND s.status = 'confirmed')
    INTO v_freed_l, v_freed_s
    FROM surfcamp.signup s WHERE s.registration_id = p_registration_id;

  UPDATE surfcamp.registration
     SET status = 'cancelled', cancelled_at = now(),
         cancel_reason = nullif(btrim(coalesce(p_reason,'')),''),
         cancelled_by  = CASE WHEN p_phone IS NULL THEN 'admin' ELSE 'self' END
   WHERE id = p_registration_id;

  UPDATE surfcamp.signup
     SET status = 'cancelled', cancelled_at = now()
   WHERE registration_id = p_registration_id AND status <> 'cancelled';

  v_promoted := surfcamp.promote_program('lesson') || surfcamp.promote_program('special');

  INSERT INTO surfcamp.event_log(registration_id, kind, detail)
  VALUES (p_registration_id,
          CASE WHEN p_phone IS NULL THEN 'admin_cancel' ELSE 'cancel' END,
          jsonb_build_object('freed', jsonb_build_object('lesson', v_freed_l, 'special', v_freed_s),
                             'reason', p_reason));

  RETURN jsonb_build_object(
    'ok', true, 'cancelled', true,
    'rep_name', v_reg.rep_name, 'phone', v_reg.phone,
    'freed', jsonb_build_object('lesson', v_freed_l, 'special', v_freed_s),
    'promoted', v_promoted);
END $function$;

CREATE OR REPLACE FUNCTION public.surfcamp_cancel_program(p_registration_id uuid, p_phone text, p_program text, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  v_reg       surfcamp.registration%ROWTYPE;
  v_phone_in  TEXT;
  v_freed     INT;
  v_active    INT;
  v_remaining INT;
  v_whole     BOOLEAN := false;
  v_promoted  JSONB := '[]'::jsonb;
BEGIN
  IF p_program NOT IN ('lesson', 'special') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_program');
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('surfcamp:2026'));

  SELECT * INTO v_reg FROM surfcamp.registration r
   WHERE r.id = p_registration_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF v_reg.status <> 'active' THEN
    RETURN jsonb_build_object('ok', true, 'cancelled', false, 'promoted', '[]'::jsonb);
  END IF;

  IF p_phone IS NOT NULL THEN
    v_phone_in := regexp_replace(p_phone, '\D', '', 'g');
    IF v_phone_in <> v_reg.phone THEN
      RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
    END IF;
    -- 018: 본인 취소 게이트
    IF NOT (SELECT c.self_cancel_open FROM surfcamp.config c WHERE c.id = 1) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'cancel_closed');
    END IF;
  END IF;

  SELECT count(*) FILTER (WHERE s.status <> 'cancelled'),
         count(*) FILTER (WHERE s.status = 'confirmed')
    INTO v_active, v_freed
    FROM surfcamp.signup s
   WHERE s.registration_id = p_registration_id AND s.program = p_program;

  IF v_active = 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_such_program');
  END IF;

  UPDATE surfcamp.signup
     SET status = 'cancelled', cancelled_at = now()
   WHERE registration_id = p_registration_id
     AND program = p_program
     AND status <> 'cancelled';

  SELECT count(*) INTO v_remaining
    FROM surfcamp.signup s
   WHERE s.registration_id = p_registration_id AND s.status <> 'cancelled';

  IF v_remaining = 0 THEN
    v_whole := true;
    UPDATE surfcamp.registration
       SET status = 'cancelled', cancelled_at = now(),
           cancel_reason = nullif(btrim(coalesce(p_reason, '')), ''),
           cancelled_by  = CASE WHEN p_phone IS NULL THEN 'admin' ELSE 'self' END
     WHERE id = p_registration_id;
  END IF;

  v_promoted := surfcamp.promote_program(p_program);

  INSERT INTO surfcamp.event_log(registration_id, kind, detail)
  VALUES (p_registration_id,
          CASE WHEN p_phone IS NULL THEN 'admin_cancel_program' ELSE 'cancel_program' END,
          jsonb_build_object('program', p_program, 'freed', v_freed,
                             'whole_registration_cancelled', v_whole,
                             'reason', p_reason));

  RETURN jsonb_build_object(
    'ok', true, 'cancelled', true,
    'program', p_program,
    'rep_name', v_reg.rep_name, 'phone', v_reg.phone,
    'freed', v_freed,
    'whole_cancelled', v_whole,
    'promoted', v_promoted);
END $function$;

-- 즉시 닫는다.
UPDATE surfcamp.config SET self_cancel_open = false, updated_at = now() WHERE id = 1;
